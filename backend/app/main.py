from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.websockets import router as websocket_router
from app.api.sse import router as sse_router
from app.core.middleware import restful_cache_middleware

app = FastAPI(
    title="HR AI Platform",
    description="MVP HR-платформы со сквозным процессом подбора, AI matching и подготовкой к Keycloak SSO.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Добавляем middleware для RESTful caching headers
app.add_middleware(restful_cache_middleware)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/cache/stats")
def get_cache_stats():
    """Получить статистику кэша для всего приложения"""
    from app.core.cache import cache
    return cache.get_stats()


app.include_router(api_router)
# app.include_router(websocket_router, prefix="/ws")  # WebSocket пока не используем
app.include_router(sse_router)  # SSE для real-time уведомлений
