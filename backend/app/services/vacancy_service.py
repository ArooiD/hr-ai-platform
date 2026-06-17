from sqlalchemy.orm import Session

from app.repositories import vacancy_repository
from app.schemas import Vacancy, VacancyCreate
from app.services.mapper_service import vacancy_to_schema
from app.services.text_service import clean_string, join_clean_list


def list_vacancies(db: Session) -> list[Vacancy]:
    return [vacancy_to_schema(vacancy) for vacancy in vacancy_repository.list_vacancies(db)]


def create_vacancy(db: Session, payload: VacancyCreate) -> Vacancy:
    normalized_payload = VacancyCreate(
        title=clean_string(payload.title),
        department=clean_string(payload.department),
        description=clean_string(payload.description),
        required_skills=payload.required_skills,
        salary_from=payload.salary_from,
        salary_to=payload.salary_to,
    )
    vacancy = vacancy_repository.create_vacancy(db, normalized_payload, join_clean_list(payload.required_skills))
    return vacancy_to_schema(vacancy)


def update_vacancy(db: Session, vacancy_id: int, payload: VacancyCreate) -> Vacancy:
    vacancy = vacancy_repository.get_vacancy_or_404(db, vacancy_id)
    normalized_payload = VacancyCreate(
        title=clean_string(payload.title),
        department=clean_string(payload.department),
        description=clean_string(payload.description),
        required_skills=payload.required_skills,
        salary_from=payload.salary_from,
        salary_to=payload.salary_to,
    )
    updated = vacancy_repository.update_vacancy(db, vacancy, normalized_payload, join_clean_list(payload.required_skills))
    return vacancy_to_schema(updated)


def close_vacancy(db: Session, vacancy_id: int) -> Vacancy:
    vacancy = vacancy_repository.get_vacancy_or_404(db, vacancy_id)
    return vacancy_to_schema(vacancy_repository.close_vacancy(db, vacancy))


def delete_vacancy(db: Session, vacancy_id: int) -> dict:
    vacancy = vacancy_repository.get_vacancy_or_404(db, vacancy_id)
    vacancy_repository.delete_vacancy(db, vacancy)
    return {"status": "deleted", "vacancy_id": vacancy_id}
