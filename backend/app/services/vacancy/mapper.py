"""Vacancy Mapper - Маппинг вакансий"""
from app.schemas import VacancyCreate
from app.models.db_models import VacancyModel
from app.services.core.text_service import clean_string


class VacancyMapper:
    """Маппер для вакансий"""
    
    @staticmethod
    def to_model(payload: VacancyCreate) -> VacancyModel:
        """Преобразовать схему в модель"""
        return VacancyModel(
            title=clean_string(payload.title),
            department=clean_string(payload.department),
            description=clean_string(payload.description) if payload.description else "",
            required_skills=payload.required_skills or [],
            salary_from=payload.salary_from,
            salary_to=payload.salary_to,
            status="open"
        )
