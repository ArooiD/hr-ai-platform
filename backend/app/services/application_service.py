"""Application service - Business logic for applications"""
import json
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import CandidateModel, VacancyModel, ApplicationStage as ModelApplicationStage
from app.repositories.application_repository import (
    list_applications,
    get_application_or_404,
    create_application,
    save_ai_analysis,
    update_stage,
    get_candidate_from_repository as get_candidate,
    get_vacancy_from_repository as get_vacancy,
)
from app.schemas import Application, ApplicationCreate, StageUpdate
from app.services.mapper_service import application_to_schema, candidate_to_schema, vacancy_to_schema
from app.services.ai import analyze_candidate, generate_interview_questions
from app.services.notification_service import notification_service
from app.schemas import NotificationType


class ApplicationService:
    """Сервис для работы с откликами"""
    
    @staticmethod
    def list_applications(db: Session) -> list[Application]:
        """Получить все отклики"""
        applications = list_applications(db)
        return [Application.model_validate(a) for a in applications]
    
    @staticmethod
    def create_application(db: Session, payload: ApplicationCreate) -> Application:
        """Создать отклик"""
        # Проверка существования кандидата и вакансии
        candidate = get_candidate(db, payload.candidate_id)
        vacancy = get_vacancy(db, payload.vacancy_id)
        
        if not candidate:
            raise HTTPException(status_code=404, detail="Кандидат не найден")
        if not vacancy:
            raise HTTPException(status_code=404, detail="Вакансия не найдена")
        
        # Создание отклика
        application = create_application(db, payload.candidate_id, payload.vacancy_id)
        
        # Создаём уведомление о новом отклике
        vacancy_schema = Vacancy.model_validate(vacancy)
        candidate_schema = Candidate.model_validate(candidate)
        notification_service.create_notification(
            notification_type=NotificationType.APPLICATION_NEW,
            title="Новый отклик",
            message=f'Кандидат "{candidate_schema.full_name}" откликнулся на вакансию "{vacancy_schema.title}"',
            entity_type="application",
            entity_id=application.id
        )
        
        return Application.model_validate(application)
    
    @staticmethod
    def analyze_application(db: Session, application_id: int) -> Application:
        """Провести AI анализ отклика"""
        application = get_application_or_404(db, application_id)
        
        candidate = db.query(CandidateModel).filter(CandidateModel.id == application.candidate_id).first()
        vacancy = db.query(VacancyModel).filter(VacancyModel.id == application.vacancy_id).first()
        
        if not candidate or not vacancy:
            raise HTTPException(status_code=404, detail="Кандидат или вакансия не найдены")
        
        analysis = analyze_candidate(
            candidate_to_schema(candidate).model_dump(), 
            vacancy_to_schema(vacancy).model_dump()
        )
        
        updated = save_ai_analysis(db, application, json.dumps(analysis, ensure_ascii=False))
        
        # Создаём уведомление о готовности AI анализа
        notification_service.create_notification(
            notification_type=NotificationType.AI_ANALYSIS_READY,
            title="AI анализ готов",
            message=f'AI анализ отклика #{application.id} завершён (совпадение: {analysis["score"]}%)',
            entity_type="application",
            entity_id=application.id
        )
        
        return Application.model_validate(updated)
    
    @staticmethod
    def get_interview_questions(db: Session, application_id: int) -> dict:
        """Получить вопросы для интервью"""
        application = get_application_or_404(db, application_id)
        
        candidate = db.query(CandidateModel).filter(CandidateModel.id == application.candidate_id).first()
        vacancy = db.query(VacancyModel).filter(VacancyModel.id == application.vacancy_id).first()
        
        if not candidate or not vacancy:
            raise HTTPException(status_code=404, detail="Кандидат или вакансия не найдены")
        
        return generate_interview_questions(
            candidate_to_schema(candidate).model_dump(), 
            vacancy_to_schema(vacancy).model_dump()
        )
    
    @staticmethod
    def update_application_stage(db: Session, application_id: int, payload: StageUpdate) -> Application:
        """Обновить стадию отклика"""
        application = get_application_or_404(db, application_id)
        
        old_stage = application.stage
        updated = update_stage(db, application, ModelApplicationStage(payload.stage))
        
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
                
                vacancy_schema = Vacancy.model_validate(vacancy)
                candidate_schema = Candidate.model_validate(candidate)
                
                notification_service.create_notification(
                    notification_type=NotificationType.APPLICATION_STAGE_CHANGED,
                    title="Изменена стадия отклика",
                    message=f'Кандидат "{candidate_schema.full_name}" переведён на стадию "{stage_name}" для вакансии "{vacancy_schema.title}"',
                    entity_type="application",
                    entity_id=application.id
                )
        
        return Application.model_validate(updated)
