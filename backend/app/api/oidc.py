"""
OIDC Callback Handler
Обработка callback от Keycloak после успешной аутентификации
"""
from typing import Optional
from urllib.parse import quote, urlparse
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
import requests
import os
import secrets

from app.core.keycloak_auth import KEYCLOAK_URL, KEYCLOAK_REALM, KEYCLOAK_CLIENT_ID

router = APIRouter(prefix="/oidc", tags=["oidc"])

# Конфигурация
KEYCLOAK_CLIENT_SECRET = os.getenv("KEYCLOAK_CLIENT_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# В production используйте Redis или базу данных для хранения state
# Здесь для простоты используем контекстную переменную (не для production!)
from contextvars import ContextVar
state_store: ContextVar[dict] = ContextVar("state_store", default={})


@router.get("/login-url")
def get_login_url(request: Request, redirect_after: str = "/vacancies"):
    """
    Получить URL для перенаправления на Keycloak login
    
    Args:
        request: FastAPI request object
        redirect_after: URL для перенаправления после успешного входа
        
    Returns:
        Keycloak login URL с правильным redirect_uri и state
    """
    # Получаем host из запроса (учитывая Nginx)
    host = request.headers.get("host", "localhost:80")
    protocol = "https" if request.headers.get("x-forwarded-proto") == "https" else "http"
    
    # Callback URI на backend (куда Keycloak вернет код)
    callback_uri = f"{protocol}://{host}/api/oidc/callback"
    
    # Генерируем state с сохранением redirect_after
    # Формат: {random_string}:{redirect_after}
    random_part = secrets.token_urlsafe(16)
    state_value = f"{random_part}:{redirect_after}"
    
    # Сохраняем redirect_after в хранилище (в production - в Redis)
    current_store = state_store.get()
    current_store[random_part] = redirect_after
    state_store.set(current_store)
    
    # Генерируем URL для Keycloak
    keycloak_url = (
        f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/auth"
        f"?client_id={KEYCLOAK_CLIENT_ID}"
        f"&redirect_uri={quote(callback_uri)}"
        f"&response_type=code"
        f"&scope=openid profile email"
        f"&state={random_part}"
    )
    
    return {
        "login_url": keycloak_url,
        "redirect_after": redirect_after,
        "callback_uri": callback_uri
    }


@router.get("/callback")
async def oidc_callback(request: Request, code: str, state: str, response: Response):
    """
    Обработка callback от Keycloak
    
    1. Обменивает authorization code на JWT токены
    2. Устанавливает токены в httpOnly куки
    3. Перенаправляет пользователя на целевую страницу frontend
    
    Args:
        request: FastAPI request object
        code: Authorization code от Keycloak
        state: State параметр (содержит random_part:redirect_after)
        response: FastAPI response object для установки куки
        
    Returns:
        RedirectResponse на frontend с целевой страницей
    """
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    
    # Извлекаем redirect_after из state
    # Формат state: random_part:redirect_after
    try:
        random_part, redirect_after = state.split(":", 1)
    except ValueError:
        # Если state не в правильном формате, используем дефолтный редирект
        random_part = state
        redirect_after = "/vacancies"
    
    # Проверяем и удаляем state из хранилища (защита от повторного использования)
    current_store = state_store.get()
    stored_redirect = current_store.get(random_part)
    if stored_redirect:
        redirect_after = stored_redirect
        del current_store[random_part]
        state_store.set(current_store)
    
    # Получаем callback URI для обмена токенов
    host = request.headers.get("host", "localhost:80")
    protocol = "https" if request.headers.get("x-forwarded-proto") == "https" else "http"
    callback_uri = f"{protocol}://{host}/api/oidc/callback"
    
    # Обмен authorization code на JWT токены
    token_url = f"{KEYCLOAK_URL}/realms/{KEYCLOAK_REALM}/protocol/openid-connect/token"
    
    payload = {
        "client_id": KEYCLOAK_CLIENT_ID,
        "client_secret": KEYCLOAK_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": callback_uri
    }
    
    try:
        token_response = requests.post(token_url, data=payload, timeout=30)
        token_response.raise_for_status()
        token_data = token_response.json()
        
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        
        if not access_token:
            raise HTTPException(status_code=500, detail="No access_token in response")
        
        # Устанавливаем access_token в httpOnly куки
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=protocol == "https",
            samesite="lax",
            max_age=3600,  # 1 час
            path="/"
        )
        
        # Устанавливаем refresh_token если есть
        if refresh_token:
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=protocol == "https",
                samesite="lax",
                max_age=86400,  # 24 часа
                path="/"
            )
        
        # ПРЯМОЙ РЕДИРЕКТ на frontend с целевой страницей
        # Никаких лишних /callback страниц!
        final_redirect = f"{FRONTEND_URL}{redirect_after}"
        
        return RedirectResponse(url=final_redirect, status_code=303)
        
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Token exchange timeout")
    except requests.exceptions.RequestException as e:
        error_detail = str(e)
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_data = e.response.json()
                error_detail = error_data.get('error_description', str(e))
            except:
                error_detail = str(e)
        raise HTTPException(status_code=500, detail=f"Token exchange failed: {error_detail}")
