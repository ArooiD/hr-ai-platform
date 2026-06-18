"""Demo Service - Генерация демо данных"""


class DemoService:
    """Сервис для генерации демо данных"""
    
    @staticmethod
    def seed_demo_data(db):
        from app.repositories.vacancy_repo import create_vacancy
        from app.repositories.candidate_repository import create_candidate
        from app.repositories.application_repository import create_application
        from app.schemas import VacancyCreate, CandidateCreate
        
        vacancies = [
            VacancyCreate(title="Senior Python Developer", department="Engineering", description="Ищем Python разработчика", required_skills=["Python", "FastAPI"]),
            VacancyCreate(title="Frontend Developer", department="Engineering", description="Ищем React разработчика", required_skills=["React", "JavaScript"]),
        ]
        
        created_vacancies = [create_vacancy(db, v) for v in vacancies]
        
        candidates = [
            CandidateCreate(full_name="Иван Иванов", email="ivan@example.com", phone="+79991234567", skills=["Python", "FastAPI"], experience_years=5, resume_text="Опытный Python разработчик"),
            CandidateCreate(full_name="Анна Петрова", email="anna@example.com", phone="+79997654321", skills=["React", "JavaScript"], experience_years=3, resume_text="Frontend разработчик"),
        ]
        
        created_candidates = [create_candidate(db, c) for c in candidates]
        
        applications = [create_application(db, created_candidates[0].id, created_vacancies[0].id)]
        
        return {"vacancies": len(created_vacancies), "candidates": len(created_candidates), "applications": len(applications)}


demo_service = DemoService()
