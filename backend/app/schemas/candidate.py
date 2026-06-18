"""Candidate schemas"""
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class CandidateBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience_years: int = 0
    resume_text: str = ""


class CandidateCreate(CandidateBase):
    pass


class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None
    resume_text: Optional[str] = None


class Candidate(CandidateBase):
    id: int

    class Config:
        from_attributes = True
