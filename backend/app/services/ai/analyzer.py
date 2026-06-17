"""AI-powered candidate analysis and interview question generation."""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas import Candidate, Vacancy, AiAnalysis


# Анализ соответствия кандидата вакансии
def analyze_candidate(candidate: "Candidate", vacancy: "Vacancy") -> "AiAnalysis":
    """Analyze candidate's fit for a vacancy using AI logic.
    
    Args:
        candidate: Candidate object with skills and experience
        vacancy: Vacancy object with required skills
        
    Returns:
        AiAnalysis object with score, matched/missing skills, and recommendation
    """
    from app.schemas import AiAnalysis
    from app.services.ai.utils import normalize_skill
    
    candidate_skills = {normalize_skill(skill) for skill in candidate.skills}
    required_skills = {normalize_skill(skill) for skill in vacancy.required_skills}

    matched = sorted(candidate_skills & required_skills)
    missing = sorted(required_skills - candidate_skills)
    score = 50 if not required_skills else round(len(matched) / len(required_skills) * 100)

    if score >= 80:
        recommendation = "Кандидат хорошо подходит. Рекомендуется техническое интервью."
    elif score >= 50:
        recommendation = "Кандидат частично подходит. Рекомендуется дополнительный скрининг."
    else:
        recommendation = "Кандидат слабо соответствует вакансии. Рекомендуется отказ или резерв."

    summary = (
        f"Кандидат {candidate.full_name} имеет {candidate.experience_years} лет опыта. "
        f"Совпадающие навыки: {', '.join(matched) if matched else 'нет'}. "
        f"Недостающие навыки: {', '.join(missing) if missing else 'нет'}."
    )

    return AiAnalysis(
        score=score,
        matched_skills=matched,
        missing_skills=missing,
        summary=summary,
        recommendation=recommendation,
    )


# Генерация вопросов для интервью на основе навыков
def generate_interview_questions(candidate: "Candidate", vacancy: "Vacancy") -> list[str]:
    """Generate interview questions based on candidate and vacancy.
    
    Args:
        candidate: Candidate object
        vacancy: Vacancy object with required skills
        
    Returns:
        List of up to 8 interview questions
    """
    questions: list[str] = []

    # 2 questions per required skill
    for skill in vacancy.required_skills:
        questions.append(f"Расскажите о практическом опыте с {skill}.")
        questions.append(f"Какие сложные задачи вы решали с использованием {skill}?")

    # 1 general question about fit
    questions.append(f"Почему ваш опыт подходит для позиции «{vacancy.title}»?")

    return questions[:8]
