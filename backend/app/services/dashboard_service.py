from sqlalchemy.orm import Session

from app.models import ApplicationModel, CandidateModel, VacancyModel, VacancyStatus as ModelVacancyStatus


def get_dashboard(db: Session) -> dict:
    return {
        "vacancies": db.query(VacancyModel).count(),
        "candidates": db.query(CandidateModel).count(),
        "applications": db.query(ApplicationModel).count(),
        "open_vacancies": db.query(VacancyModel).filter(VacancyModel.status == ModelVacancyStatus.open).count(),
    }
