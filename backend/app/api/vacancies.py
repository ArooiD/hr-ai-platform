"""Vacancy API routes - Controller layer"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import Vacancy, VacancyCreate
from app.services.vacancy.service import VacancyService

router = APIRouter(prefix="/vacancies", tags=["vacancies"])


@router.post("", response_model=Vacancy)
def create_vacancy(payload: VacancyCreate, db: Session = Depends(get_db)):
    """Создать вакансию"""
    return VacancyService.create_vacancy(db, payload)


@router.get("", response_model=list[Vacancy])
def list_vacancies(db: Session = Depends(get_db)):
    """Получить все вакансии"""
    return VacancyService.list_vacancies(db)


@router.put("/{vacancy_id}", response_model=Vacancy)
def update_vacancy(vacancy_id: int, payload: VacancyCreate, db: Session = Depends(get_db)):
    """Обновить вакансию"""
    return VacancyService.update_vacancy(db, vacancy_id, payload)


@router.delete("/{vacancy_id}")
def delete_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    """Удалить вакансию"""
    return VacancyService.delete_vacancy(db, vacancy_id)


@router.patch("/{vacancy_id}/close", response_model=Vacancy)
def close_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    """Закрыть вакансию"""
    return VacancyService.close_vacancy(db, vacancy_id)

@router.patch("/{vacancy_id}/reopen", response_model=Vacancy)
def reopen_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    """Переоткрыть вакансию"""
    return VacancyService.reopen_vacancy(db, vacancy_id)

@router.post("/{vacancy_id}/auto-close")
def auto_close_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    """Автоматически закрыть вакансию, если все отклики обработаны"""
    auto_closed = VacancyService.auto_close_if_completed(db, vacancy_id)
    return {"autoClosed": auto_closed}
