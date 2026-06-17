from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.repositories import candidate_repository
from app.schemas import Candidate, CandidateCreate
from app.services.mapper_service import candidate_to_schema
from app.services.text_service import clean_string, join_clean_list, normalize_email
from app.services.validation_service import validate_candidate_payload


def list_candidates(db: Session) -> list[Candidate]:
    return [candidate_to_schema(candidate) for candidate in candidate_repository.list_candidates(db)]


def create_candidate(db: Session, payload: CandidateCreate) -> Candidate:
    validate_candidate_payload(payload)
    email = normalize_email(payload.email)
    if candidate_repository.get_candidate_by_email(db, email) is not None:
        raise HTTPException(status_code=409, detail=f"Кандидат с email {email} уже существует")
    normalized_payload = CandidateCreate(
        full_name=clean_string(payload.full_name),
        email=email,
        phone=clean_string(payload.phone),
        skills=payload.skills,
        experience_years=payload.experience_years,
        resume_text=clean_string(payload.resume_text),
    )
    candidate = candidate_repository.create_candidate(db, normalized_payload, email, join_clean_list(payload.skills))
    return candidate_to_schema(candidate)


def update_candidate(db: Session, candidate_id: int, payload: CandidateCreate) -> Candidate:
    validate_candidate_payload(payload)
    email = normalize_email(payload.email)
    candidate = candidate_repository.get_candidate_or_404(db, candidate_id)
    duplicate = candidate_repository.get_duplicate_email_candidate(db, email, candidate_id)
    if duplicate is not None:
        raise HTTPException(status_code=409, detail=f"Кандидат с email {email} уже существует")
    normalized_payload = CandidateCreate(
        full_name=clean_string(payload.full_name),
        email=email,
        phone=clean_string(payload.phone),
        skills=payload.skills,
        experience_years=payload.experience_years,
        resume_text=clean_string(payload.resume_text),
    )
    updated = candidate_repository.update_candidate(db, candidate, normalized_payload, email, join_clean_list(payload.skills))
    return candidate_to_schema(updated)


def delete_candidate(db: Session, candidate_id: int) -> dict:
    candidate = candidate_repository.get_candidate_or_404(db, candidate_id)
    candidate_repository.delete_candidate(db, candidate)
    return {"status": "deleted", "candidate_id": candidate_id}
