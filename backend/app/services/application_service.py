import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.services.ai import analyze_candidate, generate_interview_questions
from app.models import CandidateModel, VacancyModel, ApplicationStage as ModelApplicationStage
from app.repositories import application_repository, candidate_repository, vacancy_repository
from app.schemas import Application, ApplicationCreate, StageUpdate
from app.services.mapper_service import application_to_schema, candidate_to_schema, vacancy_to_schema
from app.services.notification_service import notification_service
from app.schemas import NotificationType


def list_applications(db: Session) -> list[Application]:
    return [application_to_schema(application) for application in application_repository.list_applications(db)]


def create_application(db: Session, payload: ApplicationCreate) -> Application:
    candidate = candidate_repository.get_candidate_or_404(db, payload.candidate_id)
    vacancy = vacancy_repository.get_vacancy_or_404(db, payload.vacancy_id)
    application = application_repository.create_application(db, payload.candidate_id, payload.vacancy_id)
    
    # Создаём уведомление о новом отклике
    vacancy_schema = vacancy_to_schema(vacancy)
    candidate_schema = candidate_to_schema(candidate)
    notification_service.create_notification(
        notification_type=NotificationType.APPLICATION_NEW,
        title="Новый отклик",
        message=f'Кандидат "{candidate_schema.full_name}" откликнулся на вакансию "{vacancy_schema.title}"',
        entity_type="application",
        entity_id=application.id
    )
    
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
    old_stage = application.stage
    updated = application_repository.update_stage(db, application, ModelApplicationStage(payload.stage))
    
    # Создаём уведомление при изменении стадии (кроме перехода в new)
    if old_stage != ModelApplicationStage.new and payload.stage != old_stage:
        vacancy = db.query(VacancyModel).filter(VacancyModel.id == application.vacancy_id).first()
        candidate = db.query(CandidateModel).filter(CandidateModel.id == application.candidate_id).first()
        
        if vacancy and candidate:
            stage_names = {
                "screening": "скрининг",
                "interview": "интервью",
                "offer": "оффер",
                "hired": "принят",
                "rejected": "отклонён"
            }
            stage_name = stage_names.get(payload.stage, payload.stage)
            
            vacancy_schema = vacancy_to_schema(vacancy)
            candidate_schema = candidate_to_schema(candidate)
            
            notification_service.create_notification(
                notification_type=NotificationType.APPLICATION_STAGE_CHANGED,
                title="Изменена стадия отклика",
                message=f'Кандидат "{candidate_schema.full_name}" переведён на стадию "{stage_name}" для вакансии "{vacancy_schema.title}"',
                entity_type="application",
                entity_id=application.id
            )
    
    return application_to_schema(updated)
