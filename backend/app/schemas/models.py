from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class VacancyStatus(str, Enum):
    open = "open"
    closed = "closed"


class ApplicationStage(str, Enum):
    new = "new"
    screening = "screening"
    interview = "interview"
    offer = "offer"
    hired = "hired"
    rejected = "rejected"


class VacancyCreate(BaseModel):
    title: str
    department: str
    description: str
    required_skills: List[str] = Field(default_factory=list)
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None


class Vacancy(VacancyCreate):
    id: int
    status: VacancyStatus = VacancyStatus.open


class CandidateCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience_years: int = 0
    resume_text: str = ""


class Candidate(CandidateCreate):
    id: int


class CandidateUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    skills: List[str] | None = None
    experience_years: int | None = None
    resume_text: str | None = None


class ApplicationCreate(BaseModel):
    candidate_id: int
    vacancy_id: int


class AiAnalysis(BaseModel):
    score: int
    matched_skills: List[str]
    missing_skills: List[str]
    summary: str
    recommendation: str


class Application(BaseModel):
    id: int
    candidate_id: int
    vacancy_id: int
    stage: ApplicationStage = ApplicationStage.new
    ai_analysis: Optional[AiAnalysis] = None


class StageUpdate(BaseModel):
    stage: ApplicationStage


# Notification schemas
class NotificationType(str, Enum):
    APPLICATION_NEW = "application_new"
    VACANCY_CLOSED = "vacancy_closed"
    APPLICATION_STAGE_CHANGED = "application_stage_changed"
    AI_ANALYSIS_READY = "ai_analysis_ready"


class Notification(BaseModel):
    id: str
    type: NotificationType
    title: str
    message: str
    created_at: str
    is_read: bool
    entity_type: Optional[str] = None  # "vacancy", "candidate", "application"
    entity_id: Optional[int] = None
