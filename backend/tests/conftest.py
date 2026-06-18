"""Pytest fixtures and configuration"""
import pytest
from unittest.mock import Mock, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.db_models import VacancyModel, CandidateModel, ApplicationModel


@pytest.fixture
def test_db():
    """Создание тестовой базы данных в памяти"""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSession()
    yield db
    db.close()


@pytest.fixture
def sample_vacancy():
    """Пробная вакансия"""
    return VacancyModel(
        title="Senior Python Developer",
        department="Engineering",
        description="Ищем опытного Python разработчика",
        required_skills='["Python", "FastAPI", "PostgreSQL"]',
        salary_from=200000,
        salary_to=300000,
        status="open"
    )


@pytest.fixture
def sample_candidate():
    """Пробный кандидат"""
    return CandidateModel(
        full_name="Иван Иванов",
        email="ivan@example.com",
        phone="+79991234567",
        skills='["Python", "FastAPI", "Django"]',
        experience_years=5,
        resume_text="Опытный Python разработчик с 5 годами опыта"
    )


@pytest.fixture
def sample_application(sample_vacancy, sample_candidate):
    """Пробный отклик"""
    return ApplicationModel(
        candidate_id=sample_candidate.id,
        vacancy_id=sample_vacancy.id,
        stage="new"
    )
