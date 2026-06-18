"""Auth Service - Аутентификация"""


class AuthService:
    """Сервис аутентификации (mock)"""
    
    @staticmethod
    def login(username: str, password: str) -> dict:
        return {
            "access_token": f"mock-token-{username}",
            "token_type": "bearer"
        }


auth_service = AuthService()
