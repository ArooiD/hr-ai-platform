"""WebSocket Manager - Управление WebSocket подключениями"""
import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket

from app.schemas import Notification


class WebSocketManager:
    """Менеджер WebSocket подключений для real-time уведомлений"""
    
    def __init__(self):
        # Хранение активных подключений: user_id -> set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        """Принять WebSocket подключение"""
        await websocket.accept()
        
        async with self._lock:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            self.active_connections[user_id].add(websocket)
    
    async def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        """Закрыть WebSocket подключение"""
        async with self._lock:
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                # Удалить пользователя, если нет активных подключений
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
    
    async def send_notification(self, user_id: str, notification: Notification) -> None:
        """Отправить уведомление всем подключениям пользователя"""
        async with self._lock:
            connections = self.active_connections.get(user_id, set()).copy()
        
        if not connections:
            return
        
        message = json.dumps({
            "type": "notification_new",
            "data": notification.model_dump()
        }, ensure_ascii=False)
        
        disconnected = set()
        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.add(connection)
        
        # Удалить разорванные подключения
        if disconnected:
            async with self._lock:
                if user_id in self.active_connections:
                    self.active_connections[user_id] -= disconnected
    
    async def broadcast_to_user(
        self, 
        user_id: str, 
        event_type: str, 
        data: dict
    ) -> None:
        """Отправить событие пользователю"""
        async with self._lock:
            connections = self.active_connections.get(user_id, set()).copy()
        
        if not connections:
            return
        
        message = json.dumps({
            "type": event_type,
            "data": data
        }, ensure_ascii=False)
        
        disconnected = set()
        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.add(connection)
        
        # Удалить разорванные подключения
        if disconnected:
            async with self._lock:
                if user_id in self.active_connections:
                    self.active_connections[user_id] -= disconnected
    
    def get_connection_count(self, user_id: str) -> int:
        """Получить количество активных подключений пользователя"""
        connections = self.active_connections.get(user_id, set())
        return len(connections)
    
    def get_total_connections(self) -> int:
        """Получить общее количество активных подключений"""
        return sum(len(conns) for conns in self.active_connections.values())


# Глобальный экземпляр
websocket_manager = WebSocketManager()
