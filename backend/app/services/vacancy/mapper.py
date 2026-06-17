"""Vacancy mapping between models and schemas."""

from app.models import VacancyModel
from app.schemas import Vacancy, VacancyCreate, VacancyUpdate


class VacancyMapper:
    """Mapper for vacancy entities."""
    
    def to_schema(self, model: VacancyModel) -> Vacancy:
        """Convert VacancyModel to Vacancy schema.
        
        Args:
            model: VacancyModel from database
            
        Returns:
            Vacancy schema instance
        """
        return Vacancy(
            id=model.id,
            title=model.title,
            department=model.department,
            description=model.description,
            required_skills=model.required_skills or [],
            salary_from=model.salary_from,
            salary_to=model.salary_to,
            status=model.status,
        )
    
    def to_create_model(self, payload: VacancyCreate) -> VacancyModel:
        """Convert VacancyCreate to VacancyModel for creation.
        
        Args:
            payload: VacancyCreate schema
            
        Returns:
            VacancyModel instance (not saved)
        """
        return VacancyModel(
            title=payload.title,
            department=payload.department,
            description=payload.description,
            required_skills=payload.required_skills,
            salary_from=payload.salary_from,
            salary_to=payload.salary_to,
            status="open",
        )
    
    def update_from_payload(self, model: VacancyModel, payload: VacancyUpdate) -> None:
        """Update VacancyModel from VacancyUpdate payload.
        
        Args:
            model: VacancyModel to update
            payload: VacancyUpdate schema with new values
        """
        if payload.title is not None:
            model.title = payload.title
        if payload.department is not None:
            model.department = payload.department
        if payload.description is not None:
            model.description = payload.description
        if payload.required_skills is not None:
            model.required_skills = payload.required_skills
        if payload.salary_from is not None:
            model.salary_from = payload.salary_from
        if payload.salary_to is not None:
            model.salary_to = payload.salary_to
        if payload.status is not None:
            model.status = payload.status
