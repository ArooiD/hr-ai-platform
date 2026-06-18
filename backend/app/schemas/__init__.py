"""Pydantic schemas - Data models for API"""

# Import from domain-specific modules
from app.schemas.vacancy import Vacancy, VacancyCreate, VacancyUpdate
from app.schemas.candidate import Candidate, CandidateCreate, CandidateUpdate
from app.schemas.application import Application, ApplicationCreate, StageUpdate
from app.schemas.notification import Notification

# Import enums and other models
from app.schemas.models import (
    VacancyStatus,
    ApplicationStage,
    NotificationType,
    AiAnalysis,
)

__all__ = [
    # Enums
    "VacancyStatus",
    "ApplicationStage",
    "NotificationType",
    # Vacancy
    "Vacancy",
    "VacancyCreate",
    "VacancyUpdate",
    # Candidate
    "Candidate",
    "CandidateCreate",
    "CandidateUpdate",
    # Application
    "Application",
    "ApplicationCreate",
    "StageUpdate",
    # AI
    "AiAnalysis",
    # Notification
    "Notification",
]
