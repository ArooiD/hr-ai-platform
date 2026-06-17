from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class VacancyStatus(str, enum.Enum):
    open = "open"
    closed = "closed"


class ApplicationStage(str, enum.Enum):
    new = "new"
    screening = "screening"
    interview = "interview"
    offer = "offer"
    hired = "hired"
    rejected = "rejected"


class VacancyModel(Base):
    __tablename__ = "vacancies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    department = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    required_skills = Column(Text, default="")  # JSON-like string separated by commas
    salary_from = Column(Integer, nullable=True)
    salary_to = Column(Integer, nullable=True)
    status = Column(Enum(VacancyStatus), default=VacancyStatus.open)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    applications = relationship("ApplicationModel", back_populates="vacancy", cascade="all, delete-orphan")


class CandidateModel(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    skills = Column(Text, default="")  # JSON-like string separated by commas
    experience_years = Column(Integer, default=0)
    resume_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    applications = relationship("ApplicationModel", back_populates="candidate")


class ApplicationModel(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    vacancy_id = Column(Integer, ForeignKey("vacancies.id", ondelete="CASCADE"), nullable=False)
    stage = Column(Enum(ApplicationStage), default=ApplicationStage.new)
    ai_analysis = Column(Text, nullable=True)  # JSON-like analysis data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    candidate = relationship("CandidateModel", back_populates="applications")
    vacancy = relationship("VacancyModel", back_populates="applications")
