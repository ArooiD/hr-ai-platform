"""Vacancy service - Business logic for vacancies"""
from sqlalchemy.orm import Session

from app.models import VacancyModel
from app.schemas import Vacancy, VacancyCreate
from app.repositories.vacancy_repo import VacancyRepository
from app.services.text_service import clean_string, join_clean_list
from app.services.notification_service import notification_service
from app.schemas import NotificationType


class VacancyService:
    """Сервис для работы с вакансиями"""
    
    @staticmethod
    def list_vacancies(db: Session) -> list[Vacancy]:
        """Получить все вакансии"""
        vacancies = VacancyRepository.list(db)
        return [Vacancy.model_validate(v) for v in vacancies]
    
    @staticmethod
    def create_vacancy(db: Session, payload: VacancyCreate) -> Vacancy:
        """Создать вакансию"""
        normalized_payload = VacancyCreate(
            title=clean_string(payload.title),
            department=clean_string(payload.department),
            description=clean_string(payload.description),
            required_skills=payload.required_skills,
            salary_from=payload.salary_from,
            salary_to=payload.salary_to,
        )
        vacancy = VacancyRepository.create(
            db, 
            normalized_payload, 
            join_clean_list(payload.required_skills)
        )
        return Vacancy.model_validate(vacancy)
    
    @staticmethod
    def update_vacancy(db: Session, vacancy_id: int, payload: VacancyCreate) -> Vacancy:
        """Обновить вакансию"""
        vacancy = VacancyRepository.get_or_404(db, vacancy_id)
        normalized_payload = VacancyCreate(
            title=clean_string(payload.title),
            department=clean_string(payload.department),
            description=clean_string(payload.description),
            required_skills=payload.required_skills,
            salary_from=payload.salary_from,
            salary_to=payload.salary_to,
        )
        updated = VacancyRepository.update(
            db, 
            vacancy, 
            normalized_payload, 
            join_clean_list(payload.required_skills)
        )
        return Vacancy.model_validate(updated)
    
    @staticmethod
    def close_vacancy(db: Session, vacancy_id: int) -> Vacancy:
        """Закрыть вакансию"""
        vacancy = VacancyRepository.get_or_404(db, vacancy_id)
        vacancy_schema = Vacancy.model_validate(vacancy)
        
        # Создаём уведомление о закрытии вакансии
        notification_service.create_notification(
            notification_type=NotificationType.VACANCY_CLOSED,
            title="Вакансия закрыта",
            message=f'Вакансия "{vacancy_schema.title}" закрыта',
            entity_type="vacancy",
            entity_id=vacancy.id
        )
        
        closed = VacancyRepository.close(db, vacancy)
        return Vacancy.model_validate(closed)
    
    @staticmethod
    def delete_vacancy(db: Session, vacancy_id: int) -> dict:
        """Удалить вакансию"""
        vacancy = VacancyRepository.get_or_404(db, vacancy_id)
        VacancyRepository.delete(db, vacancy)
        return {"status": "deleted", "vacancy_id": vacancy_id}
