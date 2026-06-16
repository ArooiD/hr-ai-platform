from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.ai_service import analyze_candidate, generate_interview_questions
from app.schemas import (
    Application,
    ApplicationCreate,
    ApplicationStage,
    Candidate,
    CandidateCreate,
    StageUpdate,
    Vacancy,
    VacancyCreate,
    VacancyStatus,
    AiAnalysis,
)
from app.database import get_db, engine
from app.models import VacancyModel, CandidateModel, ApplicationModel, VacancyStatus as ModelVacancyStatus, ApplicationStage as ModelApplicationStage

app = FastAPI(
    title="HR AI Platform",
    description="MVP HR-платформы со сквозным процессом подбора и мокнутым AI.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    login: str
    password: Optional[str] = None


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
        except:
            pass
    
    return Application(
        id=application.id,
        candidate_id=application.candidate_id,
        vacancy_id=application.vacancy_id,
        stage=application.stage,
        ai_analysis=ai_analysis,
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    if payload.login.strip().lower() != "depopova":
        raise HTTPException(status_code=401, detail="Invalid login")

    return {
        "access_token": "mock-token-depopova",
        "token_type": "bearer",
        "user": {
            "login": "depopova",
            "full_name": "Дарья Попова",
            "role": "HR business partner",
            "department": "HR",
        },
    }


def clean_string(text: Optional[str]) -> str:
    """Remove NUL characters that PostgreSQL doesn't support"""
    if text is None:
        return ""
    return str(text).replace('\x00', '').replace('\0', '').strip()


def clean_list(items: List[str]) -> List[str]:
    """Clean strings in a list"""
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


@app.post("/api/vacancies", response_model=Vacancy)
def create_vacancy(payload: VacancyCreate, db: Session = Depends(get_db)):
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
    return vacancy_to_schema(vacancy)


@app.get("/api/vacancies", response_model=List[Vacancy])
def list_vacancies(db: Session = Depends(get_db)):
    vacancies = db.query(VacancyModel).all()
    return [vacancy_to_schema(v) for v in vacancies]


@app.put("/api/vacancies/{vacancy_id}", response_model=Vacancy)
def update_vacancy(vacancy_id: int, payload: VacancyCreate, db: Session = Depends(get_db)):
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
    return vacancy_to_schema(vacancy)


@app.delete("/api/vacancies/{vacancy_id}")
def delete_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    vacancy = db.query(VacancyModel).filter(VacancyModel.id == vacancy_id).first()
    if vacancy is None:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    
    db.delete(vacancy)
    db.commit()
    return {"status": "deleted", "vacancy_id": vacancy_id}


@app.patch("/api/vacancies/{vacancy_id}/close", response_model=Vacancy)
def close_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    vacancy = db.query(VacancyModel).filter(VacancyModel.id == vacancy_id).first()
    if vacancy is None:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    vacancy.status = ModelVacancyStatus.closed
    db.commit()
    db.refresh(vacancy)
    return vacancy_to_schema(vacancy)


@app.post("/api/candidates", response_model=Candidate)
def create_candidate(payload: CandidateCreate, db: Session = Depends(get_db)):
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
    return candidate_to_schema(candidate)


@app.get("/api/candidates", response_model=List[Candidate])
def list_candidates(db: Session = Depends(get_db)):
    candidates = db.query(CandidateModel).all()
    return [candidate_to_schema(c) for c in candidates]


@app.put("/api/candidates/{candidate_id}", response_model=Candidate)
def update_candidate(candidate_id: int, payload: CandidateCreate, db: Session = Depends(get_db)):
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
    return candidate_to_schema(candidate)


@app.delete("/api/candidates/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    db.delete(candidate)
    db.commit()
    return {"status": "deleted", "candidate_id": candidate_id}


@app.post("/api/applications", response_model=Application)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)):
    candidate = db.query(CandidateModel).filter(CandidateModel.id == payload.candidate_id).first()
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    vacancy = db.query(VacancyModel).filter(VacancyModel.id == payload.vacancy_id).first()
    if vacancy is None:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    application = ApplicationModel(
        candidate_id=payload.candidate_id,
        vacancy_id=payload.vacancy_id,
        stage=ModelApplicationStage.new,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application_to_schema(application)


@app.get("/api/applications", response_model=List[Application])
def list_applications(db: Session = Depends(get_db)):
    applications = db.query(ApplicationModel).all()
    return [application_to_schema(a) for a in applications]


@app.post("/api/applications/{application_id}/analyze", response_model=Application)
def analyze_application(application_id: int, db: Session = Depends(get_db)):
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    candidate = db.query(CandidateModel).filter(CandidateModel.id == application.candidate_id).first()
    vacancy = db.query(VacancyModel).filter(VacancyModel.id == application.vacancy_id).first()
    if candidate is None or vacancy is None:
        raise HTTPException(status_code=404, detail="Candidate or vacancy not found")

    import json
    analysis = analyze_candidate(
        candidate_to_schema(candidate).model_dump(),
        vacancy_to_schema(vacancy).model_dump(),
    )
    application.ai_analysis = json.dumps(analysis, ensure_ascii=False)
    db.commit()
    db.refresh(application)
    return application_to_schema(application)


@app.get("/api/applications/{application_id}/interview-questions")
def interview_questions(application_id: int, db: Session = Depends(get_db)):
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    candidate = db.query(CandidateModel).filter(CandidateModel.id == application.candidate_id).first()
    vacancy = db.query(VacancyModel).filter(VacancyModel.id == application.vacancy_id).first()
    if candidate is None or vacancy is None:
        raise HTTPException(status_code=404, detail="Candidate or vacancy not found")

    return generate_interview_questions(
        candidate_to_schema(candidate).model_dump(),
        vacancy_to_schema(vacancy).model_dump(),
    )


@app.patch("/api/applications/{application_id}/stage", response_model=Application)
def update_application_stage(application_id: int, payload: StageUpdate, db: Session = Depends(get_db)):
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    application.stage = ModelApplicationStage(payload.stage)
    db.commit()
    db.refresh(application)
    return application_to_schema(application)


@app.post("/api/demo-seed")
def seed_demo(db: Session = Depends(get_db)):
    if db.query(VacancyModel).count() == 0:
        vacancy = VacancyModel(
            title="Middle Python Developer",
            department="IT Development",
            description="Разработка backend-сервисов на FastAPI, интеграции с PostgreSQL и Redis.",
            required_skills="Python,FastAPI,PostgreSQL,Docker,Git,REST API",
            salary_from=180000,
            salary_to=250000,
            status=ModelVacancyStatus.open,
        )
        db.add(vacancy)

    if db.query(CandidateModel).count() == 0:
        candidate = CandidateModel(
            full_name="Иван Иванов",
            email="ivan.ivanov@example.com",
            phone="+7 900 000-00-00",
            skills="Python,PostgreSQL,Docker",
            experience_years=2,
            resume_text="Backend developer with Python, PostgreSQL and Docker experience.",
        )
        db.add(candidate)

    db.commit()
    return {"status": "seeded"}


@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    return {
        "vacancies": db.query(VacancyModel).count(),
        "candidates": db.query(CandidateModel).count(),
        "applications": db.query(ApplicationModel).count(),
        "open_vacancies": db.query(VacancyModel).filter(VacancyModel.status == ModelVacancyStatus.open).count(),
    }
