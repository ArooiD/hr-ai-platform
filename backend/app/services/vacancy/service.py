"""Vacancy domain service - business logic for vacancies."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import VacancyModel
from app.repositories import vacancy_repository
from app.schemas import Vacancy, VacancyCreate, VacancyUpdate
from app.services.vacancy.validation import VacancyValidator
from app.services.vacancy.mapper import VacancyMapper


class VacancyService:
    """Service for vacancy domain operations."""
    
    def __init__(self):
        self.validator = VacancyValidator()
        self.mapper = VacancyMapper()
    
    def list_vacancies(self, db: Session, status: str | None = None) -> list[Vacancy]:
        """Get all vacancies, optionally filtered by status.
        
        Args:
            db: Database session
            status: Optional status filter ("open" or "closed")
            
        Returns:
            List of Vacancy schemas
        """
        models = vacancy_repository.list_vacancies(db, status)
        return [self.mapper.to_schema(model) for model in models]
    
    def get_vacancy(self, db: Session, vacancy_id: int) -> Vacancy:
        """Get a specific vacancy by ID.
        
        Args:
            db: Database session
            vacancy_id: Vacancy ID
            
        Returns:
            Vacancy schema
            
        Raises:
            HTTPException: If vacancy not found
        """
        model = vacancy_repository.get_vacancy(db, vacancy_id)
        if not model:
            raise HTTPException(status_code=404, detail="Вакансия не найдена")
        return self.mapper.to_schema(model)
    
    def create_vacancy(self, db: Session, payload: VacancyCreate) -> Vacancy:
        """Create a new vacancy.
        
        Args:
            db: Database session
            payload: VacancyCreate schema
            
        Returns:
            Created Vacancy schema
            
        Raises:
            HTTPException: If validation fails
        """
        # Validate
        errors = self.validator.validate_create(payload)
        if payload.required_skills:
            errors.extend(self.validator.validate_skills(payload.required_skills))
        
        if errors:
            raise HTTPException(status_code=400, detail=errors)
        
        # Create and save
        model = self.mapper.to_create_model(payload)
        saved = vacancy_repository.create_vacancy(db, model)
        return self.mapper.to_schema(saved)
    
    def update_vacancy(self, db: Session, vacancy_id: int, payload: VacancyUpdate) -> Vacancy:
        """Update an existing vacancy.
        
        Args:
            db: Database session
            vacancy_id: Vacancy ID
            payload: VacancyUpdate schema
            
        Returns:
            Updated Vacancy schema
            
        Raises:
            HTTPException: If vacancy not found or validation fails
        """
        # Validate
        errors = self.validator.validate_update(payload)
        if payload.required_skills:
            errors.extend(self.validator.validate_skills(payload.required_skills))
        
        if errors:
            raise HTTPException(status_code=400, detail=errors)
        
        # Get and update
        model = vacancy_repository.get_vacancy(db, vacancy_id)
        if not model:
            raise HTTPException(status_code=404, detail="Вакансия не найдена")
        
        self.mapper.update_from_payload(model, payload)
        db.commit()
        db.refresh(model)
        
        return self.mapper.to_schema(model)
    
    def close_vacancy(self, db: Session, vacancy_id: int) -> Vacancy:
        """Close a vacancy.
        
        Args:
            db: Database session
            vacancy_id: Vacancy ID
            
        Returns:
            Updated Vacancy schema with status="closed"
            
        Raises:
            HTTPException: If vacancy not found
        """
        model = vacancy_repository.get_vacancy(db, vacancy_id)
        if not model:
            raise HTTPException(status_code=404, detail="Вакансия не найдена")
        
        model.status = "closed"
        db.commit()
        db.refresh(model)
        
        return self.mapper.to_schema(model)
    
    def delete_vacancy(self, db: Session, vacancy_id: int) -> bool:
        """Delete a vacancy.
        
        Args:
            db: Database session
            vacancy_id: Vacancy ID
            
        Returns:
            True if deleted
            
        Raises:
            HTTPException: If vacancy not found
        """
        model = vacancy_repository.get_vacancy(db, vacancy_id)
        if not model:
            raise HTTPException(status_code=404, detail="Вакансия не найдена")
        
        vacancy_repository.delete_vacancy(db, model)
        return True
