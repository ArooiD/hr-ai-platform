from fastapi import HTTPException

from app.schemas import CandidateCreate
from app.services.text_service import clean_string


def validate_candidate_payload(payload: CandidateCreate) -> None:
    text = clean_string(payload.resume_text).lower()
    practice_markers = [
        "отзыв о работе студента",
        "студент-практикант",
        "руководитель практики",
        "вид практики",
        "сроки прохождения практики",
        "программа практики",
        "практическое задание",
        "наименование принимающей организации",
    ]
    marker_count = sum(1 for marker in practice_markers if marker in text)
    has_resume_signal = any(marker in text for marker in ["резюме", "опыт работы", "skills", "experience", "github", "linkedin"])

    if marker_count >= 2 and not has_resume_signal:
        raise HTTPException(
            status_code=422,
            detail="Документ похож на отзыв о практике, а не на резюме кандидата. Проверьте файл перед сохранением.",
        )

    if payload.experience_years < 0 or payload.experience_years > 60:
        raise HTTPException(status_code=422, detail="Опыт кандидата должен быть в диапазоне от 0 до 60 лет")
