"""AI services - Анализ кандидатов и генерация вопросов"""
from app.services.ai.analyzer import AIAnalyzer, analyze_candidate, generate_interview_questions
from app.services.ai.prompt_service import (
    PromptTask,
    PromptSpec,
    build_document_classification_prompt,
    build_candidate_extraction_prompt,
    build_vacancy_categorization_prompt,
    build_candidate_vacancy_matching_prompt,
    build_interview_questions_prompt,
    build_pipeline_risk_prompt,
    to_chat_messages,
)

__all__ = [
    "AIAnalyzer",
    "analyze_candidate",
    "generate_interview_questions",
    "PromptTask",
    "PromptSpec",
    "build_document_classification_prompt",
    "build_candidate_extraction_prompt",
    "build_vacancy_categorization_prompt",
    "build_candidate_vacancy_matching_prompt",
    "build_interview_questions_prompt",
    "build_pipeline_risk_prompt",
    "to_chat_messages",
]
