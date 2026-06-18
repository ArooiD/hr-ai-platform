from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

PromptTask = Literal[
    "document_classification",
    "candidate_extraction",
    "vacancy_categorization",
    "candidate_vacancy_matching",
    "interview_questions",
    "pipeline_risk",
]


@dataclass(frozen=True)
class PromptSpec:
    task: PromptTask
    system: str
    user: str
    response_schema: dict[str, Any]
    temperature: float = 0.1


JSON_ONLY_SYSTEM = """
Ты backend AI-модуль HR-платформы. Работай как строгий сервис обработки данных.
Отвечай только валидным JSON без markdown, пояснений и лишнего текста.
Не придумывай факты, которых нет во входных данных. Если данных нет, возвращай null или пустой список.
""".strip()


def build_document_classification_prompt(document_text: str) -> PromptSpec:
    return PromptSpec(
        task="document_classification",
        system=JSON_ONLY_SYSTEM,
        user=f"""
Определи тип HR-документа и пригодность для создания кандидата.

Возможные document_type:
- resume
- vacancy
- practice_review
- cover_letter
- certificate
- unknown

Текст документа:
{document_text[:12000]}
""".strip(),
        response_schema={
            "document_type": "resume | vacancy | practice_review | cover_letter | certificate | unknown",
            "confidence": "number 0..1",
            "can_create_candidate": "boolean",
            "reason": "short string",
            "detected_entities": {
                "person_names": ["string"],
                "organizations": ["string"],
                "emails": ["string"],
                "phones": ["string"],
            },
        },
    )


def build_candidate_extraction_prompt(resume_text: str) -> PromptSpec:
    return PromptSpec(
        task="candidate_extraction",
        system=JSON_ONLY_SYSTEM,
        user=f"""
Извлеки структурированную карточку кандидата из резюме.
Не используй год окончания, даты практики или даты документа как опыт работы.
Опыт работы считай только по явно указанному профессиональному опыту.

Текст резюме:
{resume_text[:16000]}
""".strip(),
        response_schema={
            "full_name": "string | null",
            "email": "string | null",
            "phone": "string | null",
            "position": "string | null",
            "grade": "junior | middle | senior | lead | unknown",
            "experience_years": "integer 0..60",
            "skills": ["string"],
            "education": ["string"],
            "last_company": "string | null",
            "summary": "short string",
            "warnings": ["string"],
        },
    )


def build_vacancy_categorization_prompt(vacancy: dict[str, Any]) -> PromptSpec:
    return PromptSpec(
        task="vacancy_categorization",
        system=JSON_ONLY_SYSTEM,
        user=f"""
Проанализируй вакансию и верни HR-категоризацию.

Вакансия:
{vacancy}
""".strip(),
        response_schema={
            "family": "engineering | analytics | hr | sales | management | support | other",
            "specialization": "string",
            "grade": "junior | middle | senior | lead | unknown",
            "must_have_skills": ["string"],
            "nice_to_have_skills": ["string"],
            "risk_level": "low | medium | high",
            "risk_reasons": ["string"],
            "search_keywords": ["string"],
        },
    )


def build_candidate_vacancy_matching_prompt(candidate: dict[str, Any], vacancy: dict[str, Any]) -> PromptSpec:
    return PromptSpec(
        task="candidate_vacancy_matching",
        system=JSON_ONLY_SYSTEM,
        user=f"""
Оцени соответствие кандидата вакансии. Учитывай только данные из входа.

Кандидат:
{candidate}

Вакансия:
{vacancy}
""".strip(),
        response_schema={
            "score": "integer 0..100",
            "decision": "recommend | interview | reserve | reject",
            "matched_skills": ["string"],
            "missing_skills": ["string"],
            "strengths": ["string"],
            "risks": ["string"],
            "recommendation": "short string for recruiter",
        },
    )


def build_interview_questions_prompt(candidate: dict[str, Any], vacancy: dict[str, Any]) -> PromptSpec:
    return PromptSpec(
        task="interview_questions",
        system=JSON_ONLY_SYSTEM,
        user=f"""
Сформируй вопросы для технического и HR-интервью.
Вопросы должны проверять соответствие конкретной вакансии.

Кандидат:
{candidate}

Вакансия:
{vacancy}
""".strip(),
        response_schema={
            "technical_questions": [
                {"question": "string", "expected_signal": "string", "skill": "string"}
            ],
            "hr_questions": [
                {"question": "string", "expected_signal": "string"}
            ],
            "red_flags_to_check": ["string"],
        },
        temperature=0.3,
    )


def build_pipeline_risk_prompt(vacancy: dict[str, Any], applications: list[dict[str, Any]]) -> PromptSpec:
    return PromptSpec(
        task="pipeline_risk",
        system=JSON_ONLY_SYSTEM,
        user=f"""
Оцени риск закрытия вакансии по текущему pipeline.

Вакансия:
{vacancy}

Отклики:
{applications}
""".strip(),
        response_schema={
            "risk_level": "low | medium | high",
            "risk_score": "integer 0..100",
            "bottleneck_stage": "new | screening | interview | offer | hired | rejected | unknown",
            "reasons": ["string"],
            "next_actions": ["string"],
        },
    )


def to_chat_messages(prompt: PromptSpec) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": prompt.system},
        {"role": "user", "content": prompt.user + "\n\nJSON schema:\n" + str(prompt.response_schema)},
    ]
