"""Vacancy domain services."""

from app.services.vacancy.service import VacancyService
from app.services.vacancy.validation import VacancyValidator
from app.services.vacancy.mapper import VacancyMapper

__all__ = [
    "VacancyService",
    "VacancyValidator",
    "VacancyMapper",
]

# Singleton instances
vacancy_service = VacancyService()
vacancy_validator = VacancyValidator()
vacancy_mapper = VacancyMapper()
