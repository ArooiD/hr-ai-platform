"""Candidate domain service - business logic for candidates."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import CandidateModel
from app.repositories import candidate_repository
from app.schemas import Candidate, CandidateCreate, CandidateUpdate
from app.services.candidate.validation import CandidateValidator
from app.services.candidate.mapper import CandidateMapper
from app.services.candidate.parser import CandidateParser


class CandidateService:
    """Service for candidate domain operations."""
    
    def __init__(self):
        self.validator = CandidateValidator()
        self.mapper = CandidateMapper()
        self.parser = CandidateParser()
    
    def list_candidates(self, db: Session, min_experience: int | None = None) -> list[Candidate]:
        """Get all candidates, optionally filtered by minimum experience.
        
        Args:
            db: Database session
            min_experience: Optional minimum years of experience filter
            
        Returns:
            List of Candidate schemas
        """
        models = candidate_repository.list_candidates(db, min_experience)
        return [self.mapper.to_schema(model) for model in models]
    
    def get_candidate(self, db: Session, candidate_id: int) -> Candidate:
        """Get a specific candidate by ID.
        
        Args:
            db: Database session
            candidate_id: Candidate ID
            
        Returns:
            Candidate schema
            
        Raises:
            HTTPException: If candidate not found
        """
        model = candidate_repository.get_candidate(db, candidate_id)
        if not model:
            raise HTTPException(status_code=404, detail="Кандидат не найден")
        return self.mapper.to_schema(model)
    
    def create_candidate(self, db: Session, payload: CandidateCreate) -> Candidate:
        """Create a new candidate.
        
        Args:
            db: Database session
            payload: CandidateCreate schema
            
        Returns:
            Created Candidate schema
            
        Raises:
            HTTPException: If validation fails
        """
        # Validate
        errors = self.validator.validate_create(payload)
        
        if errors:
            raise HTTPException(status_code=400, detail=errors)
        
        # Check for duplicate email
        existing = candidate_repository.get_candidate_by_email(db, payload.email)
        if existing:
            raise HTTPException(status_code=409, detail="Кандидат с таким email уже существует")
        
        # Create and save
        model = self.mapper.to_create_model(payload)
        saved = candidate_repository.create_candidate(db, model)
        return self.mapper.to_schema(saved)
    
    def update_candidate(self, db: Session, candidate_id: int, payload: CandidateUpdate) -> Candidate:
        """Update an existing candidate.
        
        Args:
            db: Database session
            candidate_id: Candidate ID
            payload: CandidateUpdate schema with updated data
            
        Returns:
            Updated Candidate schema
            
        Raises:
            HTTPException: If candidate not found or validation fails
        """
        # Validate
        errors = self.validator.validate_update(payload)
        
        if errors:
            raise HTTPException(status_code=400, detail=errors)
        
        # Get candidate
        model = candidate_repository.get_candidate(db, candidate_id)
        if not model:
            raise HTTPException(status_code=404, detail="Кандидат не найден")
        
        # Check for duplicate email (if email changed)
        if payload.email is not None and payload.email != model.email:
            existing = candidate_repository.get_duplicate_email_candidate(db, payload.email, candidate_id)
            if existing:
                raise HTTPException(status_code=409, detail="Кандидат с таким email уже существует")
        
        # Update using mapper
        self.mapper.update_from_payload(model, payload)
        db.commit()
        db.refresh(model)
        
        return self.mapper.to_schema(model)
    
    def delete_candidate(self, db: Session, candidate_id: int) -> bool:
        """Delete a candidate.
        
        Args:
            db: Database session
            candidate_id: Candidate ID
            
        Returns:
            True if deleted
            
        Raises:
            HTTPException: If candidate not found
        """
        model = candidate_repository.get_candidate(db, candidate_id)
        if not model:
            raise HTTPException(status_code=404, detail="Кандидат не найден")
        
        candidate_repository.delete_candidate(db, model)
        return True
