from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
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


@app.post("/api/vacancies", response_model=Vacancy)
def create_vacancy(payload: VacancyCreate, db: Session = Depends(get_db)):
    vacancy = VacancyModel(
        title=payload.title,
        department=payload.department,
        description=payload.description,
        required_skills=",".join(payload.required_skills),
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

    vacancy.title = payload.title
    vacancy.department = payload.department
    vacancy.description = payload.description
    vacancy.required_skills = ",".join(payload.required_skills)
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
    candidate = CandidateModel(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        skills=",".join(payload.skills),
        experience_years=payload.experience_years,
        resume_text=payload.resume_text,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate_to_schema(candidate)


@app.get("/api/candidates", response_model=List[Candidate])
def list_candidates(db: Session = Depends(get_db)):
    candidates = db.query(CandidateModel).all()
    return [candidate_to_schema(c) for c in candidates]


@app.put("/api/candidates/{candidate_id}", response_model=Candidate)
def update_candidate(candidate_id: int, payload: CandidateCreate, db: Session = Depends(get_db)):
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")

    candidate.full_name = payload.full_name
    candidate.email = payload.email
    candidate.phone = payload.phone
    candidate.skills = ",".join(payload.skills)
    candidate.experience_years = payload.experience_years
    candidate.resume_text = payload.resume_text
    db.commit()
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
    import json
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    candidate = db.query(CandidateModel).filter(CandidateModel.id == application.candidate_id).first()
    vacancy = db.query(VacancyModel).filter(VacancyModel.id == application.vacancy_id).first()
    
    analysis = analyze_candidate(candidate_to_schema(candidate), vacancy_to_schema(vacancy))
    application.ai_analysis = json.dumps(analysis.model_dump())
    
    db.commit()
    db.refresh(application)
    return application_to_schema(application)


@app.patch("/api/applications/{application_id}/stage", response_model=Application)
def update_application_stage(application_id: int, payload: StageUpdate, db: Session = Depends(get_db)):
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    application.stage = ModelApplicationStage(payload.stage)
    db.commit()
    db.refresh(application)
    return application_to_schema(application)


@app.get("/api/applications/{application_id}/interview-questions")
def get_interview_questions(application_id: int, db: Session = Depends(get_db)):
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    candidate = db.query(CandidateModel).filter(CandidateModel.id == application.candidate_id).first()
    vacancy = db.query(VacancyModel).filter(VacancyModel.id == application.vacancy_id).first()
    
    return {
        "application_id": application_id,
        "questions": generate_interview_questions(candidate_to_schema(candidate), vacancy_to_schema(vacancy)),
    }


@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    applications = db.query(ApplicationModel).all()
    vacancies_list = db.query(VacancyModel).all()
    candidates_list = db.query(CandidateModel).all()
    
    scores = []
    for app in applications:
        if app.ai_analysis:
            try:
                import json
                analysis = json.loads(app.ai_analysis)
                scores.append(analysis.get("score", 0))
            except:
                pass

    by_stage = {stage.value: 0 for stage in ApplicationStage}
    for application in applications:
        by_stage[application.stage.value] += 1

    return {
        "open_vacancies": sum(1 for v in vacancies_list if v.status == ModelVacancyStatus.open),
        "closed_vacancies": sum(1 for v in vacancies_list if v.status == ModelVacancyStatus.closed),
        "candidates": len(candidates_list),
        "applications": len(applications),
        "applications_by_stage": by_stage,
        "avg_ai_score": round(sum(scores) / len(scores), 1) if scores else 0,
    }


@app.post("/api/demo-seed")
def demo_seed(db: Session = Depends(get_db)):
    vacancy = VacancyModel(
        title="Middle Python Developer",
        department="IT",
        description="Разработка backend-сервисов для HR-платформы.",
        required_skills="Python,FastAPI,Docker,SQL",
        salary_from=180000,
        salary_to=260000,
        status=ModelVacancyStatus.open,
    )
    db.add(vacancy)
    
    candidate = CandidateModel(
        full_name="Иван Петров",
        email="ivan.petrov@example.com",
        phone="+7 900 000-00-00",
        skills="Python,FastAPI,PostgreSQL",
        experience_years=3,
        resume_text="Backend-разработчик с опытом создания REST API.",
    )
    db.add(candidate)
    db.commit()
    
    application = ApplicationModel(
        candidate_id=candidate.id,
        vacancy_id=vacancy.id,
        stage=ModelApplicationStage.new,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return {
        "vacancy": vacancy_to_schema(vacancy),
        "candidate": candidate_to_schema(candidate),
        "application": application_to_schema(application),
    }

