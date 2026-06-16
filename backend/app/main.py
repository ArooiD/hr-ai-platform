import json
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.ai_service import analyze_candidate, generate_interview_questions
from app.database import get_db
from app.models import (
    ApplicationModel,
    CandidateModel,
    VacancyModel,
    VacancyStatus as ModelVacancyStatus,
    ApplicationStage as ModelApplicationStage,
)
from app.schemas import Application, ApplicationCreate, Candidate, CandidateCreate, StageUpdate, Vacancy, VacancyCreate
from app.services.auth_service import auth_service
from app.storage import (
    application_to_schema,
    candidate_to_schema,
    create_application_record,
    create_candidate_record,
    create_vacancy_record,
    update_candidate_record,
    update_vacancy_record,
    vacancy_to_schema,
)

app = FastAPI(
    title="HR AI Platform",
    description="MVP HR-платформы со сквозным процессом подбора, AI matching и подготовкой к Keycloak SSO.",
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


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    return auth_service.authenticate(payload.login, payload.password)


@app.post("/api/vacancies", response_model=Vacancy)
def create_vacancy(payload: VacancyCreate, db: Session = Depends(get_db)):
    return vacancy_to_schema(create_vacancy_record(db, payload))


@app.get("/api/vacancies", response_model=List[Vacancy])
def list_vacancies(db: Session = Depends(get_db)):
    return [vacancy_to_schema(v) for v in db.query(VacancyModel).all()]


@app.put("/api/vacancies/{vacancy_id}", response_model=Vacancy)
def update_vacancy(vacancy_id: int, payload: VacancyCreate, db: Session = Depends(get_db)):
    return vacancy_to_schema(update_vacancy_record(db, vacancy_id, payload))


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
    return candidate_to_schema(create_candidate_record(db, payload))


@app.get("/api/candidates", response_model=List[Candidate])
def list_candidates(db: Session = Depends(get_db)):
    return [candidate_to_schema(c) for c in db.query(CandidateModel).all()]


@app.put("/api/candidates/{candidate_id}", response_model=Candidate)
def update_candidate(candidate_id: int, payload: CandidateCreate, db: Session = Depends(get_db)):
    return candidate_to_schema(update_candidate_record(db, candidate_id, payload))


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
    application = create_application_record(db, payload.candidate_id, payload.vacancy_id)
    return application_to_schema(application)


@app.get("/api/applications", response_model=List[Application])
def list_applications(db: Session = Depends(get_db)):
    return [application_to_schema(a) for a in db.query(ApplicationModel).all()]


@app.post("/api/applications/{application_id}/analyze", response_model=Application)
def analyze_application(application_id: int, db: Session = Depends(get_db)):
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    candidate = db.query(CandidateModel).filter(CandidateModel.id == application.candidate_id).first()
    vacancy = db.query(VacancyModel).filter(VacancyModel.id == application.vacancy_id).first()
    if candidate is None or vacancy is None:
        raise HTTPException(status_code=404, detail="Candidate or vacancy not found")

    analysis = analyze_candidate(candidate_to_schema(candidate).model_dump(), vacancy_to_schema(vacancy).model_dump())
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

    return generate_interview_questions(candidate_to_schema(candidate).model_dump(), vacancy_to_schema(vacancy).model_dump())


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
        db.add(VacancyModel(
            title="Middle Python Developer",
            department="IT Development",
            description="Разработка backend-сервисов на FastAPI, интеграции с PostgreSQL и Redis.",
            required_skills="Python,FastAPI,PostgreSQL,Docker,Git,REST API",
            salary_from=180000,
            salary_to=250000,
            status=ModelVacancyStatus.open,
        ))
    if db.query(CandidateModel).count() == 0:
        db.add(CandidateModel(
            full_name="Иван Иванов",
            email="ivan.ivanov@example.com",
            phone="+7 900 000-00-00",
            skills="Python,PostgreSQL,Docker",
            experience_years=2,
            resume_text="Backend developer with Python, PostgreSQL and Docker experience.",
        ))
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
