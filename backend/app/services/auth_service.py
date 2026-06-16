import os
from dataclasses import dataclass
from typing import Optional

from fastapi import HTTPException, status

from app.core.config import get_settings
from app.core.security import create_access_token, verify_password


@dataclass(frozen=True)
class AuthenticatedUser:
    login: str
    full_name: str
    role: str
    department: str


class AuthService:
    def __init__(self):
        self.settings = get_settings()

    def authenticate(self, login: str, password: Optional[str] = None) -> dict:
        normalized_login = (login or "").strip().lower()
        mode = self.settings.auth_mode.lower()

        if mode == "keycloak":
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Keycloak authentication is configured but token exchange is not enabled yet",
            )

        return self._authenticate_local_identity(normalized_login, password)

    def _authenticate_local_identity(self, login: str, password: Optional[str]) -> dict:
        expected_login = self.settings.demo_user_login.lower()
        expected_hash = os.getenv("DEMO_USER_PASSWORD_HASH", "")

        if login != expected_login or not verify_password(password, expected_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        user = AuthenticatedUser(
            login=expected_login,
            full_name=os.getenv("DEMO_USER_FULL_NAME", "Дарья Попова"),
            role=os.getenv("DEMO_USER_ROLE", "HR business partner"),
            department=os.getenv("DEMO_USER_DEPARTMENT", "HR"),
        )
        token = create_access_token(
            subject=user.login,
            claims={
                "name": user.full_name,
                "role": user.role,
                "department": user.department,
                "auth_provider": "local-identity-provider",
            },
        )
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "login": user.login,
                "full_name": user.full_name,
                "role": user.role,
                "department": user.department,
            },
        }


auth_service = AuthService()
