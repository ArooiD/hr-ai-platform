"""Candidate Mapper - Маппинг кандидатов"""
from app.schemas import CandidateCreate
from app.models.db_models import CandidateModel
from app.services.core.text_service import clean_string


class CandidateMapper:
    """Маппер для кандидатов"""
    
    @staticmethod
    def to_model(payload: CandidateCreate) -> CandidateModel:
        """Преобразовать схему в модель"""
        return CandidateModel(
            full_name=clean_string(payload.full_name),
            email=payload.email,
            phone=clean_string(payload.phone) if payload.phone else None,
            skills=payload.skills or [],
            experience_years=payload.experience_years,
            resume_text=clean_string(payload.resume_text) if payload.resume_text else ""
        )
