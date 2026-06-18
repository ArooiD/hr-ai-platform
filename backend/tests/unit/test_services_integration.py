"""Integration tests for Services - проверяют нормализацию данных и работу с Repository"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.db_models import VacancyModel, CandidateModel
from app.services.vacancy.service import VacancyService
from app.services.candidate.service import CandidateService
from app.services.dashboard.service import DashboardService
from app.repositories.vacancy_repo import VacancyRepository


class TestServicesIntegration:
    """Интеграционные тесты сервисов"""

    @pytest.fixture
    def test_db(self):
        """Тестовая БД"""
        engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=engine)
        TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = TestingSession()
        yield db
        db.close()

    def test_vacancy_service_list_with_string_skills(self, test_db):
        """Тест: VacancyService.list() работает со required_skills как строкой в БД"""
        vacancy = VacancyModel(
            title="Test Vacancy",
            department="IT",
            description="Test",
            required_skills="Python,Django,FastAPI",
            status="open"
        )
        test_db.add(vacancy)
        test_db.commit()

        vacancies = VacancyService.list_vacancies(test_db)
        
        assert len(vacancies) == 1
        assert isinstance(vacancies[0].required_skills, list)
        assert "Python" in vacancies[0].required_skills

    def test_candidate_service_list_with_string_skills(self, test_db):
        """Тест: CandidateService.list() работает со skills как строкой в БД"""
        candidate = CandidateModel(
            full_name="Ivan Petrov",
            email="ivan@test.com",
            skills="Python,SQL,Docker",
            experience_years=3,
            resume_text="Test resume"
        )
        test_db.add(candidate)
        test_db.commit()

        candidates = CandidateService.list_candidates(test_db)
        
        assert len(candidates) == 1
        assert isinstance(candidates[0].skills, list)
        assert "Python" in candidates[0].skills

    def test_dashboard_service_get_stats(self, test_db):
        """Тест: DashboardService.get_dashboard() работает корректно"""
        vacancy = VacancyModel(
            title="Test",
            department="IT",
            description="Test",
            required_skills="Python",
            status="open"
        )
        candidate = CandidateModel(
            full_name="Test User",
            email="test@test.com",
            skills="Python"
        )
        test_db.add(vacancy)
        test_db.add(candidate)
        test_db.commit()

        stats = DashboardService.get_dashboard(test_db)
        
        assert "total_vacancies" in stats
        assert stats["total_vacancies"] == 1

    def test_vacancy_repository_class_based_api(self, test_db):
        """Тест: VacancyRepository использует класс-based API"""
        assert hasattr(VacancyRepository, 'list')
        assert hasattr(VacancyRepository, 'get_by_id')
        
        from app.schemas.vacancy import VacancyCreate
        payload = VacancyCreate(
            title="Repo Test",
            department="IT",
            description="Test",
            required_skills=[]
        )
        vacancy = VacancyRepository.create(test_db, payload, "Python,SQL")
        
        assert vacancy.id is not None
