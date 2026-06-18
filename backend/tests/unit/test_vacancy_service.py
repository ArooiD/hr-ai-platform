"""Unit tests for VacancyService"""
import pytest
from fastapi import HTTPException

from app.schemas import VacancyCreate
from app.services.vacancy_service import VacancyService
from app.repositories.vacancy_repo import VacancyRepository


class TestVacancyService:
    """Тесты для VacancyService"""
    
    def test_list_vacancies_empty(self, test_db):
        """Тест получения пустого списка вакансий"""
        vacancies = VacancyService.list_vacancies(test_db)
        assert len(vacancies) == 0
    
    def test_create_vacancy(self, test_db):
        """Тест создания вакансии"""
        payload = VacancyCreate(
            title="Test Vacancy",
            department="IT",
            description="Test description",
            required_skills=["Python", "FastAPI"],
            salary_from=100000,
            salary_to=200000
        )
        
        vacancy = VacancyService.create_vacancy(test_db, payload)
        
        assert vacancy.id is not None
        assert vacancy.title == "Test Vacancy"
        assert vacancy.department == "IT"
        assert vacancy.status.value == "open"
    
    def test_create_vacancy_with_empty_skills(self, test_db):
        """Тест создания вакансии без навыков"""
        payload = VacancyCreate(
            title="Test Vacancy",
            department="IT",
            description="Test description",
            required_skills=[]
        )
        
        vacancy = VacancyService.create_vacancy(test_db, payload)
        
        assert vacancy.id is not None
        assert vacancy.required_skills == []
    
    def test_update_vacancy(self, test_db, sample_vacancy):
        """Тест обновления вакансии"""
        test_db.add(sample_vacancy)
        test_db.commit()
        
        payload = VacancyCreate(
            title="Updated Vacancy",
            department="Engineering",
            description="Updated description",
            required_skills=["Python", "SQLAlchemy"]
        )
        
        updated = VacancyService.update_vacancy(test_db, sample_vacancy.id, payload)
        
        assert updated.title == "Updated Vacancy"
        assert updated.department == "Engineering"
    
    def test_update_vacancy_not_found(self, test_db):
        """Тест обновления несуществующей вакансии"""
        payload = VacancyCreate(
            title="Test",
            department="IT",
            description="Test",
            required_skills=[]
        )
        
        with pytest.raises(HTTPException) as exc_info:
            VacancyService.update_vacancy(test_db, 999, payload)
        
        assert exc_info.value.status_code == 404
    
    def test_close_vacancy(self, test_db, sample_vacancy):
        """Тест закрытия вакансии"""
        test_db.add(sample_vacancy)
        test_db.commit()
        
        closed = VacancyService.close_vacancy(test_db, sample_vacancy.id)
        
        assert closed.status.value == "closed"
    
    def test_delete_vacancy(self, test_db, sample_vacancy):
        """Тест удаления вакансии"""
        test_db.add(sample_vacancy)
        test_db.commit()
        
        result = VacancyService.delete_vacancy(test_db, sample_vacancy.id)
        
        assert result["status"] == "deleted"
        assert result["vacancy_id"] == sample_vacancy.id
        
        # Проверка что вакансия удалена
        vacancies = VacancyService.list_vacancies(test_db)
        assert len(vacancies) == 0
