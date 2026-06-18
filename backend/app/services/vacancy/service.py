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
from app.core.cache import cached, cache_invalidate, cache


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
    @cached(ttl=300, key_prefix='vacancies')
    def list_vacancies(db: Session) -> list[Vacancy]:
        """Получить все вакансии (с кэшированием)"""
        vacancies = VacancyRepository.list(db)
        return [Vacancy.model_validate(VacancyService._normalize_vacancy(v)) for v in vacancies]
    
    @staticmethod
    @cached(ttl=300, key_prefix='vacancies')
    def get_vacancy(db: Session, vacancy_id: int) -> Vacancy:
        """Получить вакансию по ID (с кэшированием)"""
        vacancy = VacancyRepository.get_or_404(db, vacancy_id)
        return Vacancy.model_validate(VacancyService._normalize_vacancy(vacancy))
    
    @staticmethod
    @cache_invalidate(pattern='vacancies:*')
    def create_vacancy(db: Session, payload: VacancyCreate) -> Vacancy:
        """Создать вакансию (инвалидирует кэш)"""
        # Валидация
        VacancyValidator.validate_create(payload)
        
        # Маппинг и создание
        vacancy_data = VacancyMapper.to_model(payload)
        vacancy = VacancyRepository.create(db, vacancy_data)
        
        return Vacancy.model_validate(VacancyService._normalize_vacancy(vacancy))
    
    @staticmethod
    @cache_invalidate(pattern='vacancies:*')
    def update_vacancy(db: Session, vacancy_id: int, payload: VacancyCreate) -> Vacancy:
        """Обновить вакансию (инвалидирует кэш)"""
        # Проверка существования
        vacancy = VacancyRepository.get_or_404(db, vacancy_id)
        
        # Валидация
        VacancyValidator.validate_update(payload)
        
        # Маппинг и обновление
        updated_vacancy = VacancyMapper.to_model(payload)
        updated = VacancyRepository.update(db, vacancy, updated_vacancy)
        
        return Vacancy.model_validate(VacancyService._normalize_vacancy(updated))
    
    @staticmethod
    @cache_invalidate(pattern='vacancies:*')
    def close_vacancy(db: Session, vacancy_id: int) -> Vacancy:
        """Закрыть вакансию (инвалидирует кэш)"""
        vacancy = VacancyRepository.get_or_404(db, vacancy_id)
        
        if vacancy.status == VacancyStatus.closed:
            raise HTTPException(status_code=400, detail="Вакансия уже закрыта")
        
        closed = VacancyRepository.close(db, vacancy_id)
        
        # Нормализуем данные и создаём схему для уведомления
        closed_normalized = VacancyService._normalize_vacancy(closed)
        vacancy_schema = Vacancy.model_validate(closed_normalized)
        
        # Создаём уведомление
        notification_service.create_notification(
            notification_type=NotificationType.VACANCY_CLOSED,
            title="Вакансия закрыта",
            message=f'Вакансия "{vacancy_schema.title}" закрыта',
            entity_type="vacancy",
            entity_id=vacancy_id
        )
        
        return vacancy_schema
    
    @staticmethod
    @cache_invalidate(pattern='vacancies:*')
    def reopen_vacancy(db: Session, vacancy_id: int) -> Vacancy:
        """Переоткрыть вакансию (инвалидирует кэш)"""
        vacancy = VacancyRepository.get_or_404(db, vacancy_id)
        
        if vacancy.status != VacancyStatus.closed:
            raise HTTPException(status_code=400, detail="Вакансия не закрыта")
        
        reopened = VacancyRepository.reopen(db, vacancy_id)
        
        # Нормализуем данные и создаём схему для уведомления
        reopened_normalized = VacancyService._normalize_vacancy(reopened)
        vacancy_schema = Vacancy.model_validate(reopened_normalized)
        
        # Создаём уведомление
        notification_service.create_notification(
            notification_type=NotificationType.VACANCY_REOPENED,
            title="Вакансия переоткрыта",
            message=f'Вакансия "{vacancy_schema.title}" переоткрыта для новых откликов',
            entity_type="vacancy",
            entity_id=vacancy_id
        )
        
        return vacancy_schema
    
    @staticmethod
    @cache_invalidate(pattern='vacancies:*')
    def auto_close_if_completed(db: Session, vacancy_id: int) -> bool:
        """Автоматически закрыть вакансию, если все отклики обработаны"""
        from app.repositories.application_repository import list_by_vacancy
        
        vacancy = VacancyRepository.get_or_404(db, vacancy_id)
        
        # Если уже закрыта - ничего не делаем
        if vacancy.status == VacancyStatus.closed:
            return False
        
        # Получаем все отклики на вакансию
        applications = list_by_vacancy(db, vacancy_id)
        
        if not applications:
            return False
        
        # Проверяем, есть ли активные отклики
        active_stages = ['new', 'screening', 'interview', 'offer']
        has_active = any(app.stage in active_stages for app in applications)
        
        # Если нет активных - закрываем
        if not has_active:
            VacancyRepository.close(db, vacancy_id)
            
            # Создаём уведомление (используем исходную вакансию, т.к. она уже была загружена)
            vacancy_normalized = VacancyService._normalize_vacancy(vacancy)
            vacancy_schema = Vacancy.model_validate(vacancy_normalized)
            notification_service.create_notification(
                notification_type=NotificationType.VACANCY_CLOSED,
                title="Вакансия автоматически закрыта",
                message=f'Все отклики обработаны. Вакансия "{vacancy_schema.title}" автоматически закрыта.',
                entity_type="vacancy",
                entity_id=vacancy_id
            )
            
            return True
        
        return False
    
    @staticmethod
    @cache_invalidate(pattern='vacancies:*')
    def delete_vacancy(db: Session, vacancy_id: int) -> dict:
        """Удалить вакансию (инвалидирует кэш)"""
        vacancy = VacancyRepository.get_or_404(db, vacancy_id)
        VacancyRepository.delete(db, vacancy)
        return {"status": "deleted", "vacancy_id": vacancy_id}
    
    @staticmethod
    def get_cache_stats() -> dict:
        """Получить статистику кэша"""
        return cache.get_stats()
