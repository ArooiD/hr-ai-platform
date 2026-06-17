"""Vacancy validation logic."""

from typing import Optional
from app.schemas import VacancyCreate, VacancyUpdate


class VacancyValidator:
    """Validator for vacancy operations."""
    
    def validate_create(self, payload: VacancyCreate) -> list[str]:
        """Validate vacancy creation data.
        
        Args:
            payload: VacancyCreate schema
            
        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []
        
        if not payload.title or not payload.title.strip():
            errors.append("Название вакансии обязательно")
        
        if not payload.department or not payload.department.strip():
            errors.append("Отдел обязательно указать")
        
        if payload.salary_from is not None and payload.salary_to is not None:
            if payload.salary_from > payload.salary_to:
                errors.append("Зарплата 'от' не может быть больше 'до'")
        
        return errors
    
    def validate_update(self, payload: VacancyUpdate) -> list[str]:
        """Validate vacancy update data.
        
        Args:
            payload: VacancyUpdate schema
            
        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []
        
        if payload.salary_from is not None and payload.salary_to is not None:
            if payload.salary_from > payload.salary_to:
                errors.append("Зарплата 'от' не может быть больше 'до'")
        
        return errors
    
    def validate_skills(self, skills: list[str]) -> list[str]:
        """Validate skills list.
        
        Args:
            skills: List of skill strings
            
        Returns:
            List of validation error messages
        """
        errors = []
        
        if len(skills) > 50:
            errors.append("Не более 50 навыков")
        
        for skill in skills:
            if not skill or not skill.strip():
                errors.append("Название навыка не может быть пустым")
                break
        
        return errors
