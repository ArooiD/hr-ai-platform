"""Vacancy repository - Data access layer for vacancies"""
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import VacancyModel
from app.schemas import VacancyCreate, VacancyUpdate


class VacancyRepository:
    """Репозиторий для работы с вакансиями"""
    
    @staticmethod
    def list(db: Session) -> List[VacancyModel]:
        """Получить все вакансии"""
        return db.query(VacancyModel).all()
    
    @staticmethod
    def get_by_id(db: Session, vacancy_id: int) -> Optional[VacancyModel]:
        """Получить вакансию по ID"""
        return db.query(VacancyModel).filter(VacancyModel.id == vacancy_id).first()
    
    @staticmethod
    def get_or_404(db: Session, vacancy_id: int) -> VacancyModel:
        """Получить вакансию или выбросить 404"""
        vacancy = VacancyRepository.get_by_id(db, vacancy_id)
        if not vacancy:
            raise HTTPException(status_code=404, detail="Вакансия не найдена")
        return vacancy
    
    @staticmethod
    def create(db: Session, payload: VacancyCreate, skills_str: str) -> VacancyModel:
        """Создать вакансию"""
        vacancy = VacancyModel(
            title=payload.title,
            department=payload.department,
            description=payload.description,
            required_skills=skills_str,
            salary_from=payload.salary_from,
            salary_to=payload.salary_to,
            status="open"
        )
        db.add(vacancy)
        db.commit()
        db.refresh(vacancy)
        return vacancy
    
    @staticmethod
    def update(db: Session, vacancy: VacancyModel, payload: VacancyCreate, skills_str: str) -> VacancyModel:
        """Обновить вакансию"""
        vacancy.title = payload.title
        vacancy.department = payload.department
        vacancy.description = payload.description
        vacancy.required_skills = skills_str
        vacancy.salary_from = payload.salary_from
        vacancy.salary_to = payload.salary_to
        db.commit()
        db.refresh(vacancy)
        return vacancy
    
    @staticmethod
    def close(db: Session, vacancy_id: int) -> VacancyModel:
        """Закрыть вакансию"""
        vacancy = VacancyModel.query.get(vacancy_id)
        if not vacancy:
            raise HTTPException(status_code=404, detail="Вакансия не найдена")
        
        vacancy.status = "closed"
        db.commit()
        db.refresh(vacancy)
        return vacancy
    
    @staticmethod
    def reopen(db: Session, vacancy_id: int) -> VacancyModel:
        """Переоткрыть вакансию"""
        vacancy = VacancyModel.query.get(vacancy_id)
        if not vacancy:
            raise HTTPException(status_code=404, detail="Вакансия не найдена")
        
        vacancy.status = "open"
        db.commit()
        db.refresh(vacancy)
        return vacancy
    
    @staticmethod
    def delete(db: Session, vacancy: VacancyModel) -> None:
        """Удалить вакансию"""
        db.delete(vacancy)
        db.commit()
