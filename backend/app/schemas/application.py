"""Application schemas"""
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class ApplicationStage(str, Enum):
    new = "new"
    screening = "screening"
    interview = "interview"
    offer = "offer"
    hired = "hired"
    rejected = "rejected"


class AiAnalysis(BaseModel):
    score: int
    matched_skills: List[str]
    missing_skills: List[str]
    summary: str
    recommendation: str


class ApplicationBase(BaseModel):
    candidate_id: int
    vacancy_id: int


class ApplicationCreate(ApplicationBase):
    pass


class StageUpdate(BaseModel):
    stage: ApplicationStage


class Application(ApplicationBase):
    id: int
    stage: ApplicationStage = ApplicationStage.new
    ai_analysis: Optional[AiAnalysis] = None

    class Config:
        from_attributes = True
