from fastapi import APIRouter

# Импорт маршрутов по доменам
from app.api import applications, auth, candidates, dashboard, vacancies, notifications

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(vacancies.router)
api_router.include_router(candidates.router)
api_router.include_router(applications.router)
api_router.include_router(dashboard.router)
api_router.include_router(notifications.router)
