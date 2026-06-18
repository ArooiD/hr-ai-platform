"""Authentication and authorization middleware"""
from typing import Optional
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.models import UserRole
from app.database import get_db

# Пока используем простой HTTP Bearer для примера
# В production нужно добавить JWT или session-based auth
security = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = None,
    db: Session = None
) -> Optional[dict]:
    """
    Получить текущего пользователя из запроса
    
    Пока используется mock auth - проверяем login из query params или headers
    В production заменить на JWT token validation
    """
    # Если нет credentials, пробуем получить из query params (для разработки)
    if not credentials:
        login = request.query_params.get("user_login")
        if login:
            # Mock user для разработки
            return {
                "id": 1,
                "login": login,
                "role": UserRole.admin if login == "admin" else UserRole.regular,
                "specialties": []
            }
        return None
    
    # В production здесь будет валидация JWT token
    token = credentials.credentials
    
    # Пока просто декодируем token как JSON (для примера)
    # В production использовать JWT library
    try:
        # Mock implementation
        user_login = token  # В production: decode JWT token
        return {
            "id": 1,
            "login": user_login,
            "role": UserRole.admin if user_login == "admin" else UserRole.regular,
            "specialties": []
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невалидные учетные данные"
        )


def require_role(*allowed_roles: UserRole):
    """
    Декоратор для требования определенной роли
    
    Example:
        @router.get("/admin")
        def admin_endpoint(current_user = Depends(require_role(UserRole.admin))):
            ...
    """
    def role_checker(
        request: Request,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
        db: Session = Depends(get_db)
    ):
        user = get_current_user(request, credentials, db)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Требуется аутентификация"
            )
        
        if user["role"] not in allowed_roles and user["role"] != UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для доступа"
            )
        
        # Добавляем пользователя в request state
        request.state.user = user
        return user
    
    return role_checker


def can_view_vacancy(user: dict, vacancy: dict) -> bool:
    """
    Проверить, может ли пользователь видеть вакансию
    
    Логика:
    - public: видят все
    - specialist: видят admin и специалисты с matching specialty
    - internal: видят только admin
    """
    if not user:
        return False
    
    user_role = user.get("role", UserRole.regular)
    user_specialties = user.get("specialties", [])
    
    vacancy_visibility = vacancy.get("visibility", "public")
    required_specialty = vacancy.get("required_specialty")
    
    # Admin видит всё
    if user_role == UserRole.admin:
        return True
    
    # Public видят все
    if vacancy_visibility == "public":
        return True
    
    # Specialist видят только если есть matching specialty
    if vacancy_visibility == "specialist":
        if user_role == UserRole.specialist:
            if required_specialty and required_specialty in user_specialties:
                return True
        return False
    
    # Internal видят только admin
    if vacancy_visibility == "internal":
        return False
    
    return True
