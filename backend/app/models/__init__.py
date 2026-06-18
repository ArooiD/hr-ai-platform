"""All database models"""
from app.models.db_models import (
    VacancyModel,
    CandidateModel,
    ApplicationModel,
    UserModel,
    VacancyStatus,
    ApplicationStage,
    CandidateStatus,
)

__all__ = [
    "VacancyModel",
    "CandidateModel",
    "ApplicationModel",
    "UserModel",
    "VacancyStatus",
    "ApplicationStage",
    "CandidateStatus",
]
