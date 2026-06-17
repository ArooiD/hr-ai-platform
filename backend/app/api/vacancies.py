from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import Vacancy, VacancyCreate
from app.services import vacancy_service

router = APIRouter(prefix="/vacancies", tags=["vacancies"])


@router.post("", response_model=Vacancy)
def create_vacancy(payload: VacancyCreate, db: Session = Depends(get_db)):
    return vacancy_service.create_vacancy(db, payload)


@router.get("", response_model=list[Vacancy])
def list_vacancies(db: Session = Depends(get_db)):
    return vacancy_service.list_vacancies(db)


@router.put("/{vacancy_id}", response_model=Vacancy)
def update_vacancy(vacancy_id: int, payload: VacancyCreate, db: Session = Depends(get_db)):
    return vacancy_service.update_vacancy(db, vacancy_id, payload)


@router.delete("/{vacancy_id}")
def delete_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    return vacancy_service.delete_vacancy(db, vacancy_id)


@router.patch("/{vacancy_id}/close", response_model=Vacancy)
def close_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    return vacancy_service.close_vacancy(db, vacancy_id)
