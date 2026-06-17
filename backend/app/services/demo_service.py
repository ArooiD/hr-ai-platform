from sqlalchemy.orm import Session

from app.models import CandidateModel, VacancyModel, VacancyStatus as ModelVacancyStatus


def seed_demo(db: Session) -> dict:
    if db.query(VacancyModel).count() == 0:
        db.add(VacancyModel(
            title="Middle Python Developer",
            department="IT Development",
            description="Разработка backend-сервисов на FastAPI, интеграции с PostgreSQL и Redis.",
            required_skills="Python,FastAPI,PostgreSQL,Docker,Git,REST API",
            salary_from=180000,
            salary_to=250000,
            status=ModelVacancyStatus.open,
        ))
    if db.query(CandidateModel).count() == 0:
        db.add(CandidateModel(
            full_name="Иван Иванов",
            email="ivan.ivanov@example.com",
            phone="+7 900 000-00-00",
            skills="Python,PostgreSQL,Docker",
            experience_years=2,
            resume_text="Backend developer with Python, PostgreSQL and Docker experience.",
        ))
    db.commit()
    return {"status": "seeded"}
