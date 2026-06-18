"""Candidate service - Business logic for candidates"""
from sqlalchemy.orm import Session

from app.schemas import Candidate, CandidateCreate, CandidateUpdate
from app.repositories.candidate_repository import (
    list_candidates,
    get_candidate_or_404,
    create_candidate,
    update_candidate,
    delete_candidate,
)
from app.services.text_service import clean_string


class CandidateService:
    """Сервис для работы с кандидатами"""
    
    @staticmethod
    def list_candidates(db: Session) -> list[Candidate]:
        """Получить всех кандидатов"""
        candidates = list_candidates(db)
        return [Candidate.model_validate(c) for c in candidates]
    
    @staticmethod
    def create_candidate(db: Session, payload: CandidateCreate) -> Candidate:
        """Создать кандидата"""
        normalized_payload = CandidateCreate(
            full_name=clean_string(payload.full_name),
            email=payload.email,
            phone=clean_string(payload.phone) if payload.phone else None,
            skills=payload.skills,
            experience_years=payload.experience_years,
            resume_text=clean_string(payload.resume_text),
        )
        candidate = create_candidate(db, normalized_payload)
        return Candidate.model_validate(candidate)
    
    @staticmethod
    def update_candidate(db: Session, candidate_id: int, payload: CandidateUpdate) -> Candidate:
        """Обновить кандидата"""
        candidate = get_candidate_or_404(db, candidate_id)
        
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None and field != 'email':
                setattr(candidate, field, clean_string(value) if isinstance(value, str) else value)
            elif field == 'email' and value is not None:
                candidate.email = value
        
        db.commit()
        db.refresh(candidate)
        return Candidate.model_validate(candidate)
    
    @staticmethod
    def delete_candidate(db: Session, candidate_id: int) -> dict:
        """Удалить кандидата"""
        candidate = get_candidate_or_404(db, candidate_id)
        delete_candidate(db, candidate)
        return {"status": "deleted", "candidate_id": candidate_id}
