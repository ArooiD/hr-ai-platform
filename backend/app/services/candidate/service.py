"""Candidate Service - Business logic for candidates"""
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.schemas import Candidate, CandidateCreate, CandidateUpdate
from app.repositories.candidate_repository import (
    list_candidates,
    get_candidate_or_404,
    get_candidate_by_email,
    create_candidate,
    delete_candidate,
)
from app.services.candidate.validation import CandidateValidator
from app.services.candidate.mapper import CandidateMapper
from app.services.notification.service import notification_service
from app.schemas import NotificationType


class CandidateService:
    """Сервис для работы с кандидатами"""
    
    @staticmethod
    def _normalize_candidate(candidate) -> dict:
        """Нормализовать данные кандидата (преобразовать skills из строки в список)"""
        # Преобразуем SQLAlchemy модель в dict
        if hasattr(candidate, '__dict__'):
            candidate = {k: v for k, v in candidate.__dict__.items() if not k.startswith('_')}
        
        if isinstance(candidate, dict):
            skills = candidate.get('skills', [])
            if isinstance(skills, str):
                candidate = candidate.copy()
                candidate['skills'] = [s.strip() for s in skills.split(',') if s.strip()]
        return candidate

    @staticmethod
    def list_candidates(db: Session) -> list[Candidate]:
        """Получить всех кандидатов"""
        candidates = list_candidates(db)
        return [Candidate.model_validate(CandidateService._normalize_candidate(c)) for c in candidates]
    
    @staticmethod
    def get_candidate(db: Session, candidate_id: int) -> Candidate:
        """Получить кандидата по ID"""
        candidate = get_candidate_or_404(db, candidate_id)
        return Candidate.model_validate(CandidateService._normalize_candidate(candidate))
    
    @staticmethod
    def create_candidate(db: Session, payload: CandidateCreate) -> Candidate:
        """Создать кандидата"""
        # Валидация
        CandidateValidator.validate_create(payload)
        
        # Проверка дубликатов email
        if get_candidate_by_email(db, payload.email):
            raise HTTPException(status_code=400, detail="Кандидат с таким email уже существует")
        
        # Маппинг и создание
        candidate_data = CandidateMapper.to_model(payload)
        candidate = create_candidate(db, candidate_data)
        
        return Candidate.model_validate(candidate)
    
    @staticmethod
    def update_candidate(db: Session, candidate_id: int, payload: CandidateUpdate) -> Candidate:
        """Обновить кандидата"""
        candidate = get_candidate_or_404(db, candidate_id)
        
        # Валидация
        CandidateValidator.validate_update(payload)
        
        # Проверка дубликатов email (если email изменился)
        if payload.email and payload.email != candidate.email:
            if get_candidate_by_email(db, payload.email):
                raise HTTPException(status_code=400, detail="Кандидат с таким email уже существует")
        
        # Обновление полей
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(candidate, field, value)
        
        db.commit()
        db.refresh(candidate)
        
        return Candidate.model_validate(candidate)
    
    @staticmethod
    def delete_candidate(db: Session, candidate_id: int) -> dict:
        """Удалить кандидата"""
        candidate = get_candidate_or_404(db, candidate_id)
        delete_candidate(db, candidate)
        return {"status": "deleted", "candidate_id": candidate_id}
