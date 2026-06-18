"""Candidate API routes - Controller layer"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import Candidate, CandidateCreate, CandidateUpdate
from app.services.candidate.service import CandidateService

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.post("", response_model=Candidate)
def create_candidate(payload: CandidateCreate, db: Session = Depends(get_db)):
    """Создать кандидата"""
    return CandidateService.create_candidate(db, payload)


@router.get("", response_model=list[Candidate])
def list_candidates(db: Session = Depends(get_db)):
    """Получить всех кандидатов"""
    return CandidateService.list_candidates(db)


@router.put("/{candidate_id}", response_model=Candidate)
def update_candidate(candidate_id: int, payload: CandidateUpdate, db: Session = Depends(get_db)):
    """Обновить кандидата"""
    return CandidateService.update_candidate(db, candidate_id, payload)


@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Удалить кандидата"""
    return CandidateService.delete_candidate(db, candidate_id)
