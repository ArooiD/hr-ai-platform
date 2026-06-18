"""Application Service - Business logic for applications"""
import json
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import CandidateModel, VacancyModel, ApplicationStage as ModelApplicationStage
from app.schemas import Application, ApplicationCreate, StageUpdate
from app.services.application.validation import ApplicationValidator
from app.repositories.application_repository import (
    list_applications, get_application_or_404, create_application,
    save_ai_analysis, update_stage, get_candidate_from_repository, get_vacancy_from_repository
)
from app.services.ai.analyzer import AIAnalyzer
from app.services.notification.service import notification_service
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
        ApplicationValidator.validate_create(payload)
        
        candidate = get_candidate_from_repository(db, payload.candidate_id)
        vacancy = get_vacancy_from_repository(db, payload.vacancy_id)
        
        if not candidate:
            raise HTTPException(status_code=404, detail="Кандидат не найден")
        if not vacancy:
            raise HTTPException(status_code=404, detail="Вакансия не найдена")
        
        application = create_application(db, payload.candidate_id, payload.vacancy_id)
        
        notification_service.create_notification(
            notification_type=NotificationType.APPLICATION_NEW,
            title="Новый отклик",
            message=f'Кандидат откликнулся на вакансию',
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
        
        from app.schemas import Candidate, Vacancy
        candidate_data = Candidate.model_validate(candidate).model_dump()
        vacancy_data = Vacancy.model_validate(vacancy).model_dump()
        
        analysis = AIAnalyzer.analyze_candidate(candidate_data, vacancy_data)
        updated = save_ai_analysis(db, application, json.dumps(analysis, ensure_ascii=False))
        
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
        
        from app.schemas import Candidate, Vacancy
        candidate_data = Candidate.model_validate(candidate).model_dump()
        vacancy_data = Vacancy.model_validate(vacancy).model_dump()
        
        return AIAnalyzer.generate_interview_questions(candidate_data, vacancy_data)
    
    @staticmethod
    def update_application_stage(db: Session, application_id: int, payload: StageUpdate) -> Application:
        """Обновить стадию отклика"""
        application = get_application_or_404(db, application_id)
        updated = update_stage(db, application, ModelApplicationStage(payload.stage))
        
        if payload.stage != application.stage:
            notification_service.create_notification(
                notification_type=NotificationType.APPLICATION_STAGE_CHANGED,
                title="Изменена стадия отклика",
                message=f'Отклик #{application_id} переведён на стадию "{payload.stage}"',
                entity_type="application",
                entity_id=application_id
            )
        
        return Application.model_validate(updated)
