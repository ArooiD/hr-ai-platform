"""Candidate mapping between models and schemas."""

from app.models import CandidateModel
from app.schemas import Candidate, CandidateCreate, CandidateUpdate


class CandidateMapper:
    """Mapper for candidate entities."""
    
    def to_schema(self, model: CandidateModel) -> Candidate:
        """Convert CandidateModel to Candidate schema."""
        return Candidate(
            id=model.id,
            full_name=model.full_name,
            email=model.email,
            phone=model.phone,
            skills=model.skills or [],
            experience_years=model.experience_years,
            resume_text=model.resume_text,
        )
    
    def to_create_model(self, payload: CandidateCreate) -> CandidateModel:
        """Convert CandidateCreate to CandidateModel."""
        return CandidateModel(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            skills=payload.skills,
            experience_years=payload.experience_years,
            resume_text=payload.resume_text,
        )
    
    def update_from_payload(self, model: CandidateModel, payload: CandidateUpdate) -> None:
        """Update CandidateModel from payload."""
        if payload.full_name is not None:
            model.full_name = payload.full_name
        if payload.email is not None:
            model.email = payload.email
        if payload.phone is not None:
            model.phone = payload.phone
        if payload.skills is not None:
            model.skills = payload.skills
        if payload.experience_years is not None:
            model.experience_years = payload.experience_years
        if payload.resume_text is not None:
            model.resume_text = payload.resume_text
