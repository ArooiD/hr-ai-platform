from typing import Optional

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import (
    ApplicationModel,
    CandidateModel,
    VacancyModel,
    VacancyStatus as ModelVacancyStatus,
    ApplicationStage as ModelApplicationStage,
)
from app.schemas import (
    AiAnalysis,
    Application,
    Candidate,
    CandidateCreate,
    Vacancy,
    VacancyCreate,
)


def clean_string(text: Optional[str]) -> str:
    """Normalize text before saving it to PostgreSQL."""
    if text is None:
        return ""
    return str(text).replace("\x00", "").replace("\0", "").strip()


def clean_list(items: list[str]) -> list[str]:
    return [clean_string(item) for item in items if clean_string(item)]


def normalize_email(email: Optional[str]) -> str:
    return clean_string(email).lower()


def validate_candidate_payload(payload: CandidateCreate):
    text = clean_string(payload.resume_text).lower()
    practice_markers = [
        "отзыв о работе студента",
        "студент-практикант",
        "руководитель практики",
        "вид практики",
        "сроки прохождения практики",
        "программа практики",
        "практическое задание",
        "наименование принимающей организации",
    ]
    marker_count = sum(1 for marker in practice_markers if marker in text)
    has_resume_signal = any(marker in text for marker in ["резюме", "опыт работы", "skills", "experience", "github", "linkedin"])

    if marker_count >= 2 and not has_resume_signal:
        raise HTTPException(
            status_code=422,
            detail="Документ похож на отзыв о практике, а не на резюме кандидата. Проверьте файл перед сохранением.",
        )

    if payload.experience_years < 0 or payload.experience_years > 60:
        raise HTTPException(status_code=422, detail="Опыт кандидата должен быть в диапазоне от 0 до 60 лет")


def vacancy_to_schema(vacancy: VacancyModel) -> Vacancy:
    return Vacancy(
        id=vacancy.id,
        title=vacancy.title,
        department=vacancy.department,
        description=vacancy.description,
        required_skills=vacancy.required_skills.split(",") if vacancy.required_skills else [],
        salary_from=vacancy.salary_from,
        salary_to=vacancy.salary_to,
        status=vacancy.status,
    )


def candidate_to_schema(candidate: CandidateModel) -> Candidate:
    return Candidate(
        id=candidate.id,
        full_name=candidate.full_name,
        email=candidate.email,
        phone=candidate.phone,
        skills=candidate.skills.split(",") if candidate.skills else [],
        experience_years=candidate.experience_years,
        resume_text=candidate.resume_text or "",
    )


def application_to_schema(application: ApplicationModel) -> Application:
    ai_analysis = None
    if application.ai_analysis:
        import json
        try:
            ai_analysis = AiAnalysis(**json.loads(application.ai_analysis))
        except Exception:
            pass

    return Application(
        id=application.id,
        candidate_id=application.candidate_id,
        vacancy_id=application.vacancy_id,
        stage=application.stage,
        ai_analysis=ai_analysis,
    )


def create_vacancy_record(db: Session, payload: VacancyCreate) -> VacancyModel:
    vacancy = VacancyModel(
        title=clean_string(payload.title),
        department=clean_string(payload.department),
        description=clean_string(payload.description),
        required_skills=",".join(clean_list(payload.required_skills)),
        salary_from=payload.salary_from,
        salary_to=payload.salary_to,
        status=ModelVacancyStatus.open,
    )
    db.add(vacancy)
    db.commit()
    db.refresh(vacancy)
    return vacancy


def update_vacancy_record(db: Session, vacancy_id: int, payload: VacancyCreate) -> VacancyModel:
    vacancy = db.query(VacancyModel).filter(VacancyModel.id == vacancy_id).first()
    if vacancy is None:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    vacancy.title = clean_string(payload.title)
    vacancy.department = clean_string(payload.department)
    vacancy.description = clean_string(payload.description)
    vacancy.required_skills = ",".join(clean_list(payload.required_skills))
    vacancy.salary_from = payload.salary_from
    vacancy.salary_to = payload.salary_to
    db.commit()
    db.refresh(vacancy)
    return vacancy


def create_candidate_record(db: Session, payload: CandidateCreate) -> CandidateModel:
    validate_candidate_payload(payload)
    email = normalize_email(payload.email)
    existing = db.query(CandidateModel).filter(CandidateModel.email == email).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail=f"Кандидат с email {email} уже существует")

    candidate = CandidateModel(
        full_name=clean_string(payload.full_name),
        email=email,
        phone=clean_string(payload.phone),
        skills=",".join(clean_list(payload.skills)),
        experience_years=payload.experience_years,
        resume_text=clean_string(payload.resume_text),
    )
    db.add(candidate)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Кандидат с email {email} уже существует")
    db.refresh(candidate)
    return candidate


def update_candidate_record(db: Session, candidate_id: int, payload: CandidateCreate) -> CandidateModel:
    validate_candidate_payload(payload)
    email = normalize_email(payload.email)
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")

    duplicate = db.query(CandidateModel).filter(CandidateModel.email == email, CandidateModel.id != candidate_id).first()
    if duplicate is not None:
        raise HTTPException(status_code=409, detail=f"Кандидат с email {email} уже существует")

    candidate.full_name = clean_string(payload.full_name)
    candidate.email = email
    candidate.phone = clean_string(payload.phone)
    candidate.skills = ",".join(clean_list(payload.skills))
    candidate.experience_years = payload.experience_years
    candidate.resume_text = clean_string(payload.resume_text)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Кандидат с email {email} уже существует")
    db.refresh(candidate)
    return candidate


def create_application_record(db: Session, candidate_id: int, vacancy_id: int) -> ApplicationModel:
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")

    vacancy = db.query(VacancyModel).filter(VacancyModel.id == vacancy_id).first()
    if vacancy is None:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    application = ApplicationModel(
        candidate_id=candidate_id,
        vacancy_id=vacancy_id,
        stage=ModelApplicationStage.new,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application
