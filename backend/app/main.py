from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
)
from app.storage import (
    applications,
    candidates,
    next_application_id,
    next_candidate_id,
    next_vacancy_id,
    vacancies,
)

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
    password: str | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    if payload.login.strip().lower() != "dapopova":
        raise HTTPException(status_code=401, detail="Invalid login")

    return {
        "access_token": "mock-token-dapopova",
        "token_type": "bearer",
        "user": {
            "login": "dapopova",
            "full_name": "Дарья Попова",
            "role": "HR business partner",
            "department": "HR",
        },
    }


@app.post("/api/vacancies", response_model=Vacancy)
def create_vacancy(payload: VacancyCreate):
    vacancy = Vacancy(id=next_vacancy_id(), **payload.model_dump())
    vacancies[vacancy.id] = vacancy
    return vacancy


@app.get("/api/vacancies", response_model=list[Vacancy])
def list_vacancies():
    return list(vacancies.values())


@app.patch("/api/vacancies/{vacancy_id}/close", response_model=Vacancy)
def close_vacancy(vacancy_id: int):
    vacancy = vacancies.get(vacancy_id)
    if vacancy is None:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    updated = vacancy.model_copy(update={"status": VacancyStatus.closed})
    vacancies[vacancy_id] = updated
    return updated


@app.post("/api/candidates", response_model=Candidate)
def create_candidate(payload: CandidateCreate):
    candidate = Candidate(id=next_candidate_id(), **payload.model_dump())
    candidates[candidate.id] = candidate
    return candidate


@app.get("/api/candidates", response_model=list[Candidate])
def list_candidates():
    return list(candidates.values())


@app.post("/api/applications", response_model=Application)
def create_application(payload: ApplicationCreate):
    if payload.candidate_id not in candidates:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if payload.vacancy_id not in vacancies:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    application = Application(
        id=next_application_id(),
        candidate_id=payload.candidate_id,
        vacancy_id=payload.vacancy_id,
    )
    applications[application.id] = application
    return application


@app.get("/api/applications", response_model=list[Application])
def list_applications():
    return list(applications.values())


@app.post("/api/applications/{application_id}/analyze", response_model=Application)
def analyze_application(application_id: int):
    application = applications.get(application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    candidate = candidates[application.candidate_id]
    vacancy = vacancies[application.vacancy_id]
    analysis = analyze_candidate(candidate, vacancy)

    updated = application.model_copy(update={"ai_analysis": analysis})
    applications[application_id] = updated
    return updated


@app.patch("/api/applications/{application_id}/stage", response_model=Application)
def update_application_stage(application_id: int, payload: StageUpdate):
    application = applications.get(application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    updated = application.model_copy(update={"stage": payload.stage})
    applications[application_id] = updated
    return updated


@app.get("/api/applications/{application_id}/interview-questions")
def get_interview_questions(application_id: int):
    application = applications.get(application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    candidate = candidates[application.candidate_id]
    vacancy = vacancies[application.vacancy_id]
    return {
        "application_id": application_id,
        "questions": generate_interview_questions(candidate, vacancy),
    }


@app.get("/api/dashboard")
def dashboard():
    scores = [
        application.ai_analysis.score
        for application in applications.values()
        if application.ai_analysis is not None
    ]

    by_stage = {stage.value: 0 for stage in ApplicationStage}
    for application in applications.values():
        by_stage[application.stage.value] += 1

    return {
        "open_vacancies": sum(1 for item in vacancies.values() if item.status == VacancyStatus.open),
        "closed_vacancies": sum(1 for item in vacancies.values() if item.status == VacancyStatus.closed),
        "candidates": len(candidates),
        "applications": len(applications),
        "applications_by_stage": by_stage,
        "avg_ai_score": round(sum(scores) / len(scores), 1) if scores else 0,
    }


@app.post("/api/demo-seed")
def demo_seed():
    vacancy = Vacancy(
        id=next_vacancy_id(),
        title="Middle Python Developer",
        department="IT",
        description="Разработка backend-сервисов для HR-платформы.",
        required_skills=["Python", "FastAPI", "Docker", "SQL"],
        salary_from=180000,
        salary_to=260000,
    )
    vacancies[vacancy.id] = vacancy

    candidate = Candidate(
        id=next_candidate_id(),
        full_name="Иван Петров",
        email="ivan.petrov@example.com",
        phone="+7 900 000-00-00",
        skills=["Python", "FastAPI", "PostgreSQL"],
        experience_years=3,
        resume_text="Backend-разработчик с опытом создания REST API.",
    )
    candidates[candidate.id] = candidate

    application = Application(
        id=next_application_id(),
        candidate_id=candidate.id,
        vacancy_id=vacancy.id,
    )
    applications[application.id] = application

    return {"vacancy": vacancy, "candidate": candidate, "application": application}
