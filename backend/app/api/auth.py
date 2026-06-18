from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.auth.service import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    login: str
    password: Optional[str] = None


@router.post("/login")
def login(payload: LoginRequest):
    return auth_service.authenticate(payload.login, payload.password)
