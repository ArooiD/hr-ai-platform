from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import ApplicationModel, ApplicationStage as ModelApplicationStage


def list_applications(db: Session) -> list[ApplicationModel]:
    return db.query(ApplicationModel).all()


def get_application_or_404(db: Session, application_id: int) -> ApplicationModel:
    application = db.query(ApplicationModel).filter(ApplicationModel.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


def create_application(db: Session, candidate_id: int, vacancy_id: int) -> ApplicationModel:
    application = ApplicationModel(
        candidate_id=candidate_id,
        vacancy_id=vacancy_id,
        stage=ModelApplicationStage.new,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def save_ai_analysis(db: Session, application: ApplicationModel, ai_analysis: str) -> ApplicationModel:
    application.ai_analysis = ai_analysis
    db.commit()
    db.refresh(application)
    return application


def update_stage(db: Session, application: ApplicationModel, stage: ModelApplicationStage) -> ApplicationModel:
    application.stage = stage
    db.commit()
    db.refresh(application)
    return application


# Helper functions для проверки существования
def get_candidate_from_repository(db: Session, candidate_id: int):
    """Получить кандидата (возвращает None если не найден)"""
    from app.repositories.candidate_repository import get_candidate
    return get_candidate(db, candidate_id)


def get_vacancy_from_repository(db: Session, vacancy_id: int):
    """Получить вакансию (возвращает None если не найден)"""
    from app.repositories.vacancy_repository import get_vacancy_or_404
    try:
        return get_vacancy_or_404(db, vacancy_id)
    except HTTPException:
        return None
