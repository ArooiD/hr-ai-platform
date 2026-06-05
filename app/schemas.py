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
