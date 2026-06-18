"""Candidate Validation - Валидация кандидатов"""
import re
from fastapi import HTTPException
from app.schemas import CandidateCreate, CandidateUpdate


class CandidateValidator:
    """Валидатор для кандидатов"""
    
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    @staticmethod
    def validate_create(payload: CandidateCreate):
        """Валидация при создании"""
        if not payload.full_name or len(payload.full_name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Имя кандидата должно быть указано")
        
        if not payload.email or not CandidateValidator.validate_email(payload.email):
            raise HTTPException(status_code=400, detail="Некорректный email")
        
        if payload.phone and not CandidateValidator.validate_phone(payload.phone):
            raise HTTPException(status_code=400, detail="Некорректный телефон")
    
    @staticmethod
    def validate_update(payload: CandidateUpdate):
        """Валидация при обновлении"""
        if payload.email and not CandidateValidator.validate_email(payload.email):
            raise HTTPException(status_code=400, detail="Некорректный email")
        
        if payload.phone and not CandidateValidator.validate_phone(payload.phone):
            raise HTTPException(status_code=400, detail="Некорректный телефон")
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Валидация email"""
        return bool(CandidateValidator.EMAIL_PATTERN.match(email))
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Валидация телефона"""
        phone_clean = ''.join(filter(str.isdigit, phone))
        return len(phone_clean) >= 10
