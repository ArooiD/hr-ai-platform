"""Main API router - объединяет все контроллеры"""
from fastapi import APIRouter

# Импортируем роутеры из API контроллеров
from app.api.vacancies import router as vacancies_router
from app.api.candidates import router as candidates_router
from app.api.applications import router as applications_router
from app.api.notifications import router as notifications_router
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.websockets import router as websocket_router

api_router = APIRouter(prefix="/api")

# Подключаем все роутеры
api_router.include_router(auth_router)
api_router.include_router(vacancies_router)
api_router.include_router(candidates_router)
api_router.include_router(applications_router)
api_router.include_router(dashboard_router)
api_router.include_router(notifications_router)
# WebSocket роутер подключается без префикса /api
