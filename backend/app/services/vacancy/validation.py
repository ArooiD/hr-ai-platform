"""Vacancy Validation - Валидация вакансий"""
from fastapi import HTTPException
from app.schemas import VacancyCreate


class VacancyValidator:
    """Валидатор для вакансий"""
    
    @staticmethod
    def validate_create(payload: VacancyCreate):
        """Валидация при создании"""
        if not payload.title or len(payload.title.strip()) < 3:
            raise HTTPException(status_code=400, detail="Название вакансии должно быть не менее 3 символов")
        
        if not payload.department or len(payload.department.strip()) < 2:
            raise HTTPException(status_code=400, detail="Отдел должен быть указан")
        
        if payload.salary_from is not None and payload.salary_to is not None:
            if payload.salary_from > payload.salary_to:
                raise HTTPException(status_code=400, detail="salary_from не может быть больше salary_to")
    
    @staticmethod
    def validate_update(payload: VacancyCreate):
        """Валидация при обновлении"""
        VacancyValidator.validate_create(payload)
