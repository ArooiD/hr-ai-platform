from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.core.keycloak_auth import KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID, APP_BASE_URL
from app.services.auth.service import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    login: str
    password: Optional[str] = None


class LoginResponse(BaseModel):
    token: str
    user: dict
    redirect_url: str


@router.post("/login")
def login(payload: LoginRequest):
    return auth_service.login(payload.login, payload.password)


@router.get("/login-url")
def get_login_url(request: Request, redirect_after: Optional[str] = None):
    """
    Получить URL для перенаправления на Keycloak login
    
    Args:
        request: FastAPI request object
        redirect_after: URL для перенаправления после успешного входа
        
    Returns:
        Keycloak login URL с правильным redirect_uri
    """
    # По умолчанию redirect на vacancies page
    if not redirect_after or redirect_after == "/":
        redirect_after = "/vacancies"
    
    # Получаем host из запроса
    host = request.headers.get("host", "localhost:80")
    protocol = "https" if request.headers.get("x-forwarded-proto") == "https" else "http"
    
    # Формируем полный redirect URI после входа
    redirect_uri = f"{protocol}://{host}{redirect_after}"
    
    # Генерируем Keycloak login URL
    keycloak_url = (
        f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/auth"
        f"?client_id={KEYCLOAK_CLIENT_ID}"
        f"&redirect_uri={quote(redirect_uri)}"
        f"&response_type=code"
        f"&scope=openid profile email"
    )
    
    return {
        "login_url": keycloak_url,
        "redirect_after": redirect_after,
        "redirect_uri": redirect_uri
    }
