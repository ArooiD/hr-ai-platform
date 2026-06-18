"""Vacancy Service - Business logic for vacancies"""
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.schemas import Vacancy, VacancyCreate, VacancyUpdate
from app.repositories.vacancy_repo import VacancyRepository
from app.models import VacancyStatus
from app.services.vacancy.validation import VacancyValidator
from app.services.vacancy.mapper import VacancyMapper
from app.services.notification.service import notification_service
from app.schemas import NotificationType


class VacancyService:
    """Сервис для работы с вакансиями"""
    
    @staticmethod
    def _normalize_vacancy(vacancy) -> dict:
        """Нормализовать данные вакансии (преобразовать required_skills из строки в список)"""
        # Преобразуем SQLAlchemy модель в dict
        if hasattr(vacancy, '__dict__'):
            vacancy = {k: v for k, v in vacancy.__dict__.items() if not k.startswith('_')}
        
        if isinstance(vacancy, dict):
            skills = vacancy.get('required_skills', [])
            if isinstance(skills, str):
                vacancy = vacancy.copy()
                vacancy['required_skills'] = [s.strip() for s in skills.split(',') if s.strip()]
        return vacancy

    @staticmethod
    def list_vacancies(db: Session) -> list[Vacancy]:
        """Получить все вакансии"""
        vacancies = VacancyRepository.list(db)
        return [Vacancy.model_validate(VacancyService._normalize_vacancy(v)) for v in vacancies]
    
    @staticmethod
    def get_vacancy(db: Session, vacancy_id: int) -> Vacancy:
        """Получить вакансию по ID"""
        vacancy = VacancyRepository.get_or_404(db, vacancy_id)
        return Vacancy.model_validate(VacancyService._normalize_vacancy(vacancy))
    
    @staticmethod
    def create_vacancy(db: Session, payload: VacancyCreate) -> Vacancy:
        """Создать вакансию"""
        # Валидация
        VacancyValidator.validate_create(payload)
        
        # Маппинг и создание
        vacancy_data = VacancyMapper.to_model(payload)
        vacancy = VacancyRepository.create(db, vacancy_data)
        
        return Vacancy.model_validate(vacancy)
    
    @staticmethod
    def update_vacancy(db: Session, vacancy_id: int, payload: VacancyCreate) -> Vacancy:
        """Обновить вакансию"""
        # Проверка существования
        VacancyRepository.get_or_404(db, vacancy_id)
        
        # Валидация
        VacancyValidator.validate_update(payload)
        
        # Маппинг и обновление
        vacancy_data = VacancyMapper.to_model(payload)
        updated = VacancyRepository.update(db, vacancy_id, vacancy_data)
        
        return Vacancy.model_validate(updated)
    
    @staticmethod
    def close_vacancy(db: Session, vacancy_id: int) -> Vacancy:
        """Закрыть вакансию"""
        vacancy = VacancyRepository.get_or_404(db, vacancy_id)
        
        if vacancy.status == VacancyStatus.closed:
            raise HTTPException(status_code=400, detail="Вакансия уже закрыта")
        
        closed = VacancyRepository.close(db, vacancy_id)
        
        # Создаём уведомление
        vacancy_schema = Vacancy.model_validate(closed)
        notification_service.create_notification(
            notification_type=NotificationType.VACANCY_CLOSED,
            title="Вакансия закрыта",
            message=f'Вакансия "{vacancy_schema.title}" закрыта',
            entity_type="vacancy",
            entity_id=vacancy_id
        )
        
        return Vacancy.model_validate(closed)
    
    @staticmethod
    def delete_vacancy(db: Session, vacancy_id: int) -> dict:
        """Удалить вакансию"""
        VacancyRepository.get_or_404(db, vacancy_id)
        VacancyRepository.delete(db, vacancy_id)
        return {"status": "deleted", "vacancy_id": vacancy_id}
