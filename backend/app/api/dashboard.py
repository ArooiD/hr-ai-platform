from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.dashboard.service import dashboard_service
from app.services.demo.service import demo_service

router = APIRouter(tags=["system"])


@router.post("/demo-seed")
def seed_demo(db: Session = Depends(get_db)):
    return demo_service.seed_demo(db)


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    return dashboard_service.get_dashboard(db)
