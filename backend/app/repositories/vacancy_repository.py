from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import VacancyModel, VacancyStatus as ModelVacancyStatus
from app.schemas import VacancyCreate


def list_vacancies(db: Session) -> list[VacancyModel]:
    return db.query(VacancyModel).all()


def get_vacancy_or_404(db: Session, vacancy_id: int) -> VacancyModel:
    vacancy = db.query(VacancyModel).filter(VacancyModel.id == vacancy_id).first()
    if vacancy is None:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return vacancy


def create_vacancy(db: Session, payload: VacancyCreate, required_skills: str) -> VacancyModel:
    vacancy = VacancyModel(
        title=payload.title,
        department=payload.department,
        description=payload.description,
        required_skills=required_skills,
        salary_from=payload.salary_from,
        salary_to=payload.salary_to,
        status=ModelVacancyStatus.open,
    )
    db.add(vacancy)
    db.commit()
    db.refresh(vacancy)
    return vacancy


def update_vacancy(db: Session, vacancy: VacancyModel, payload: VacancyCreate, required_skills: str) -> VacancyModel:
    vacancy.title = payload.title
    vacancy.department = payload.department
    vacancy.description = payload.description
    vacancy.required_skills = required_skills
    vacancy.salary_from = payload.salary_from
    vacancy.salary_to = payload.salary_to
    db.commit()
    db.refresh(vacancy)
    return vacancy


def close_vacancy(db: Session, vacancy: VacancyModel) -> VacancyModel:
    vacancy.status = ModelVacancyStatus.closed
    db.commit()
    db.refresh(vacancy)
    return vacancy


def delete_vacancy(db: Session, vacancy: VacancyModel) -> None:
    db.delete(vacancy)
    db.commit()
