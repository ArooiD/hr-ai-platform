"""Vacancy schemas"""
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class VacancyStatus(str, Enum):
    open = "open"
    closed = "closed"


class VacancyBase(BaseModel):
    title: str
    department: str
    description: str
    required_skills: List[str] = Field(default_factory=list)
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
    visibility: Optional[str] = "public"  # public, specialist, internal
    required_specialty: Optional[str] = None


class VacancyCreate(VacancyBase):
    pass


class VacancyUpdate(VacancyBase):
    pass


class Vacancy(VacancyBase):
    id: int
    status: VacancyStatus = VacancyStatus.open

    class Config:
        from_attributes = True
