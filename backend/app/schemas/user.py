"""User schemas - Pydantic models for user data"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models import UserRole


class UserBase(BaseModel):
    """Базовая схема пользователя"""
    login: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole = UserRole.regular
    specialties: Optional[str] = None


class UserCreate(UserBase):
    """Схема для создания пользователя"""
    password: Optional[str] = None  # Пока nullable для mock auth


class UserUpdate(BaseModel):
    """Схема для обновления пользователя"""
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    specialties: Optional[str] = None


class UserResponse(UserBase):
    """Схема ответа пользователя"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Схема для входа"""
    login: str
    password: Optional[str] = None  # Пока nullable для mock auth


class UserLoginResponse(BaseModel):
    """Схема ответа при входе"""
    user: UserResponse
    token: Optional[str] = None  # Для будущего JWT
