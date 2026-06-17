import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.ai_service import analyze_candidate, generate_interview_questions
from app.models import CandidateModel, VacancyModel, ApplicationStage as ModelApplicationStage
from app.repositories import application_repository, candidate_repository, vacancy_repository
from app.schemas import Application, ApplicationCreate, StageUpdate
from app.services.mapper_service import application_to_schema, candidate_to_schema, vacancy_to_schema


def list_applications(db: Session) -> list[Application]:
    return [application_to_schema(application) for application in application_repository.list_applications(db)]


def create_application(db: Session, payload: ApplicationCreate) -> Application:
    candidate_repository.get_candidate_or_404(db, payload.candidate_id)
    vacancy_repository.get_vacancy_or_404(db, payload.vacancy_id)
    application = application_repository.create_application(db, payload.candidate_id, payload.vacancy_id)
    return application_to_schema(application)


def analyze_application(db: Session, application_id: int) -> Application:
    application = application_repository.get_application_or_404(db, application_id)
    candidate = db.query(CandidateModel).filter(CandidateModel.id == application.candidate_id).first()
    vacancy = db.query(VacancyModel).filter(VacancyModel.id == application.vacancy_id).first()
    if candidate is None or vacancy is None:
        raise HTTPException(status_code=404, detail="Candidate or vacancy not found")

    analysis = analyze_candidate(candidate_to_schema(candidate).model_dump(), vacancy_to_schema(vacancy).model_dump())
    updated = application_repository.save_ai_analysis(db, application, json.dumps(analysis, ensure_ascii=False))
    return application_to_schema(updated)


def get_interview_questions(db: Session, application_id: int) -> dict:
    application = application_repository.get_application_or_404(db, application_id)
    candidate = db.query(CandidateModel).filter(CandidateModel.id == application.candidate_id).first()
    vacancy = db.query(VacancyModel).filter(VacancyModel.id == application.vacancy_id).first()
    if candidate is None or vacancy is None:
        raise HTTPException(status_code=404, detail="Candidate or vacancy not found")
    return generate_interview_questions(candidate_to_schema(candidate).model_dump(), vacancy_to_schema(vacancy).model_dump())


def update_application_stage(db: Session, application_id: int, payload: StageUpdate) -> Application:
    application = application_repository.get_application_or_404(db, application_id)
    updated = application_repository.update_stage(db, application, ModelApplicationStage(payload.stage))
    return application_to_schema(updated)
