from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import Candidate, CandidateCreate
from app.services import candidate_service

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.post("", response_model=Candidate)
def create_candidate(payload: CandidateCreate, db: Session = Depends(get_db)):
    return candidate_service.create_candidate(db, payload)


@router.get("", response_model=list[Candidate])
def list_candidates(db: Session = Depends(get_db)):
    return candidate_service.list_candidates(db)


@router.put("/{candidate_id}", response_model=Candidate)
def update_candidate(candidate_id: int, payload: CandidateCreate, db: Session = Depends(get_db)):
    return candidate_service.update_candidate(db, candidate_id, payload)


@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    return candidate_service.delete_candidate(db, candidate_id)
