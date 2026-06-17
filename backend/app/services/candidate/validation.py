"""Candidate validation logic."""

from typing import Optional
from app.schemas import CandidateCreate, CandidateUpdate
import re


class CandidateValidator:
    """Validator for candidate operations."""
    
    def validate_create(self, payload: CandidateCreate) -> list[str]:
        """Validate candidate creation data."""
        errors = []
        
        if not payload.full_name or not payload.full_name.strip():
            errors.append("ФИО обязательно")
        
        if not payload.email or not payload.email.strip():
            errors.append("Email обязательно")
        elif not self._is_valid_email(payload.email):
            errors.append("Некорректный email")
        
        if payload.phone and not self._is_valid_phone(payload.phone):
            errors.append("Некорректный телефон")
        
        return errors
    
    def validate_update(self, payload: CandidateUpdate) -> list[str]:
        """Validate candidate update data."""
        errors = []
        
        if payload.email and not self._is_valid_email(payload.email):
            errors.append("Некорректный email")
        
        if payload.phone and not self._is_valid_phone(payload.phone):
            errors.append("Некорректный телефон")
        
        return errors
    
    def _is_valid_email(self, email: str) -> bool:
        """Simple email validation."""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email.strip()))
    
    def _is_valid_phone(self, phone: str) -> bool:
        """Simple phone validation."""
        cleaned = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        return len(cleaned) >= 10 and cleaned.replace('+', '').isdigit()
