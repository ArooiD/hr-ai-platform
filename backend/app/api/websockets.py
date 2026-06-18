"""WebSocket API для real-time уведомлений"""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.websocket_manager import websocket_manager
from app.services.auth.service import AuthService


router = APIRouter(tags=["websocket"])


@router.websocket("/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: str = Query(..., description="Auth token")
):
    """
    WebSocket endpoint для real-time уведомлений
    
    Подключение:
    ws://localhost:8000/ws/notifications?token=<auth_token>
    
    Формат сообщений:
    {
        "type": "notification_new | notification_read | application_new | ...",
        "data": { ... }
    }
    """
    # Аутентификация пользователя
    user_id = AuthService.authenticate(token)
    
    if not user_id:
        await websocket.accept()
        await websocket.send_json({"error": "Unauthorized"})
        await websocket.close()
        return
    
    # Принять подключение
    await websocket_manager.connect(websocket, user_id)
    
    try:
        # Цикл ожидания сообщений от клиента (опционально)
        while True:
            # Можно получать команды от клиента, например:
            # - mark_as_read
            # - subscribe_to_entity
            # - unsubscribe
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                await handle_client_message(websocket, user_id, message)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON"})
    
    except WebSocketDisconnect:
        # Клиент отключился
        pass
    finally:
        # Очистить подключение
        await websocket_manager.disconnect(websocket, user_id)


async def handle_client_message(
    websocket: WebSocket, 
    user_id: str, 
    message: dict
) -> None:
    """Обработка сообщений от клиента"""
    msg_type = message.get("type")
    
    if msg_type == "mark_as_read":
        # Клиент подтвердил получение уведомления
        # Можно логировать статистику
        pass
    
    elif msg_type == "ping":
        # Health check
        await websocket.send_json({"type": "pong"})
    
    elif msg_type == "subscribe":
        # Подписка на события сущности (вакансия, кандидат, отклик)
        entity_type = message.get("entity_type")
        entity_id = message.get("entity_id")
        # Можно реализовать фильтрацию событий
        pass
