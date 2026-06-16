from app.schemas import AiAnalysis, Candidate, Vacancy


def normalize_skill(skill: str) -> str:
    return skill.strip().lower()


def analyze_candidate(candidate: Candidate, vacancy: Vacancy) -> AiAnalysis:
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


def generate_interview_questions(candidate: Candidate, vacancy: Vacancy) -> list[str]:
    questions: list[str] = []

    for skill in vacancy.required_skills:
        questions.append(f"Расскажите о практическом опыте с {skill}.")
        questions.append(f"Какие сложные задачи вы решали с использованием {skill}?")

    questions.append(f"Почему ваш опыт подходит для позиции «{vacancy.title}»?")

    return questions[:8]
