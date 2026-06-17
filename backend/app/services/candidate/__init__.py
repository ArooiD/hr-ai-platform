"""Candidate domain services."""

from app.services.candidate.service import CandidateService
from app.services.candidate.validation import CandidateValidator
from app.services.candidate.mapper import CandidateMapper
from app.services.candidate.parser import CandidateParser

__all__ = [
    "CandidateService",
    "CandidateValidator",
    "CandidateMapper",
    "CandidateParser",
]

# Singleton instances
candidate_service = CandidateService()
candidate_validator = CandidateValidator()
candidate_mapper = CandidateMapper()
candidate_parser = CandidateParser()
