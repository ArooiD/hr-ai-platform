from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import CandidateModel
from app.schemas import CandidateCreate


def list_candidates(db: Session, min_experience: int | None = None) -> list[CandidateModel]:
    query = db.query(CandidateModel)
    if min_experience is not None:
        query = query.filter(CandidateModel.experience_years >= min_experience)
    return query.all()


def get_candidate(db: Session, candidate_id: int) -> CandidateModel | None:
    return db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()


def get_candidate_or_404(db: Session, candidate_id: int) -> CandidateModel:
    candidate = db.query(CandidateModel).filter(CandidateModel.id == candidate_id).first()
    if candidate is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


def get_candidate_by_email(db: Session, email: str) -> CandidateModel | None:
    return db.query(CandidateModel).filter(CandidateModel.email == email).first()


def get_duplicate_email_candidate(db: Session, email: str, candidate_id: int) -> CandidateModel | None:
    return db.query(CandidateModel).filter(CandidateModel.email == email, CandidateModel.id != candidate_id).first()


def create_candidate(db: Session, payload: CandidateCreate, email: str, skills: str) -> CandidateModel:
    candidate = CandidateModel(
        full_name=payload.full_name,
        email=email,
        phone=payload.phone,
        skills=skills,
        experience_years=payload.experience_years,
        resume_text=payload.resume_text,
    )
    db.add(candidate)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Кандидат с email {email} уже существует")
    db.refresh(candidate)
    return candidate


def update_candidate(db: Session, candidate: CandidateModel, payload: CandidateCreate, email: str, skills: str) -> CandidateModel:
    candidate.full_name = payload.full_name
    candidate.email = email
    candidate.phone = payload.phone
    candidate.skills = skills
    candidate.experience_years = payload.experience_years
    candidate.resume_text = payload.resume_text
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Кандидат с email {email} уже существует")
    db.refresh(candidate)
    return candidate


def delete_candidate(db: Session, candidate: CandidateModel) -> None:
    db.delete(candidate)
    db.commit()
