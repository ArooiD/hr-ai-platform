"""All schemas"""
from app.schemas.vacancy import (
    VacancyStatus,
    VacancyBase,
    VacancyCreate,
    VacancyUpdate,
    Vacancy,
)
from app.schemas.candidate import (
    CandidateBase,
    CandidateCreate,
    CandidateUpdate,
    Candidate,
)
from app.schemas.application import (
    ApplicationStage,
    AiAnalysis,
    ApplicationBase,
    ApplicationCreate,
    StageUpdate,
    Application,
)
from app.schemas.notification import (
    NotificationType,
    Notification,
)

__all__ = [
    "VacancyStatus",
    "VacancyBase",
    "VacancyCreate",
    "VacancyUpdate",
    "Vacancy",
    "CandidateBase",
    "CandidateCreate",
    "CandidateUpdate",
    "Candidate",
    "ApplicationStage",
    "AiAnalysis",
    "ApplicationBase",
    "ApplicationCreate",
    "StageUpdate",
    "Application",
    "NotificationType",
    "Notification",
]
