from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "HR AI Platform"
    app_version: str = "0.1.0"
    auth_mode: str = Field(default="mock", alias="AUTH_MODE")
    jwt_issuer: str = Field(default="hr-ai-platform", alias="JWT_ISSUER")
    demo_user_login: str = Field(default="depopova", alias="DEMO_USER_LOGIN")
    keycloak_url: str = Field(default="http://keycloak:8080", alias="KEYCLOAK_URL")
    keycloak_realm: str = Field(default="hr-ai", alias="KEYCLOAK_REALM")
    keycloak_client_id: str = Field(default="hr-ai-frontend", alias="KEYCLOAK_CLIENT_ID")

    class Config:
        populate_by_name = True
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
