"""Application Validation - Валидация откликов"""
from app.schemas import ApplicationCreate


class ApplicationValidator:
    """Валидатор для откликов"""
    
    @staticmethod
    def validate_create(payload: ApplicationCreate):
        """Валидация при создании"""
        if payload.candidate_id <= 0:
            raise ValueError("Некорректный ID кандидата")
        if payload.vacancy_id <= 0:
            raise ValueError("Некорректный ID вакансии")
