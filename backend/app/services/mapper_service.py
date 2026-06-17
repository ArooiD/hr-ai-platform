import json

from app.models import ApplicationModel, CandidateModel, VacancyModel
from app.schemas import AiAnalysis, Application, Candidate, Vacancy


def vacancy_to_schema(vacancy: VacancyModel) -> Vacancy:
    return Vacancy(
        id=vacancy.id,
        title=vacancy.title,
        department=vacancy.department,
        description=vacancy.description,
        required_skills=vacancy.required_skills.split(",") if vacancy.required_skills else [],
        salary_from=vacancy.salary_from,
        salary_to=vacancy.salary_to,
        status=vacancy.status,
    )


def candidate_to_schema(candidate: CandidateModel) -> Candidate:
    return Candidate(
        id=candidate.id,
        full_name=candidate.full_name,
        email=candidate.email,
        phone=candidate.phone,
        skills=candidate.skills.split(",") if candidate.skills else [],
        experience_years=candidate.experience_years,
        resume_text=candidate.resume_text or "",
    )


def application_to_schema(application: ApplicationModel) -> Application:
    ai_analysis = None
    if application.ai_analysis:
        try:
            ai_analysis = AiAnalysis(**json.loads(application.ai_analysis))
        except Exception:
            ai_analysis = None

    return Application(
        id=application.id,
        candidate_id=application.candidate_id,
        vacancy_id=application.vacancy_id,
        stage=application.stage,
        ai_analysis=ai_analysis,
    )
