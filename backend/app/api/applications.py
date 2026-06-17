from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import Application, ApplicationCreate, StageUpdate
from app.services import application_service

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("", response_model=Application)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db)):
    return application_service.create_application(db, payload)


@router.get("", response_model=list[Application])
def list_applications(db: Session = Depends(get_db)):
    return application_service.list_applications(db)


@router.post("/{application_id}/analyze", response_model=Application)
def analyze_application(application_id: int, db: Session = Depends(get_db)):
    return application_service.analyze_application(db, application_id)


@router.get("/{application_id}/interview-questions")
def interview_questions(application_id: int, db: Session = Depends(get_db)):
    return application_service.get_interview_questions(db, application_id)


@router.patch("/{application_id}/stage", response_model=Application)
def update_application_stage(application_id: int, payload: StageUpdate, db: Session = Depends(get_db)):
    return application_service.update_application_stage(db, application_id, payload)
