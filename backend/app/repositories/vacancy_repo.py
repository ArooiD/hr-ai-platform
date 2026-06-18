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
    def create(db: Session, vacancy: VacancyModel) -> VacancyModel:
        """Создать вакансию"""
        db.add(vacancy)
        db.commit()
        db.refresh(vacancy)
        return vacancy
    
    @staticmethod
    def update(db: Session, vacancy: VacancyModel, updated_vacancy: VacancyModel) -> VacancyModel:
        """Обновить вакансию"""
        vacancy.title = updated_vacancy.title
        vacancy.department = updated_vacancy.department
        vacancy.description = updated_vacancy.description
        vacancy.required_skills = updated_vacancy.required_skills
        vacancy.salary_from = updated_vacancy.salary_from
        vacancy.salary_to = updated_vacancy.salary_to
        db.commit()
        db.refresh(vacancy)
        return vacancy
    
    @staticmethod
    def close(db: Session, vacancy_id: int) -> VacancyModel:
        """Закрыть вакансию"""
        vacancy = VacancyRepository.get_by_id(db, vacancy_id)
        if not vacancy:
            raise HTTPException(status_code=404, detail="Вакансия не найдена")
        
        vacancy.status = "closed"
        db.commit()
        db.refresh(vacancy)
        return vacancy
    
    @staticmethod
    def reopen(db: Session, vacancy_id: int) -> VacancyModel:
        """Переоткрыть вакансию"""
        vacancy = VacancyRepository.get_by_id(db, vacancy_id)
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
