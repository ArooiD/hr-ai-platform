"""Notification Service - Управление уведомлениями"""
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from app.schemas import Notification, NotificationType


# Импортируем SSE функции локально для избежания циклического импорта
def _send_sse_event(user_id: str, event_type: str, data: dict, priority):
    """Внутренняя функция для отправки SSE событий"""
    try:
        from app.api.sse import send_sse_event as _send
        return _send(user_id, event_type, data, priority)
    except ImportError:
        # SSE еще не загружен
        pass


class NotificationService:
    """Сервис для управления уведомлениями"""
    
    def __init__(self):
        self._notifications: dict[str, dict] = {}
        self._current_user_id: Optional[str] = None  # Для SSE отправки
    
    def set_current_user(self, user_id: Optional[str]) -> None:
        """Установить текущего пользователя для SSE уведомлений"""
        self._current_user_id = user_id
    
    def create_notification(
        self,
        notification_type: NotificationType,
        title: str,
        message: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        priority=None  # EventPriority.HIGH по умолчанию, но лениво импортируем
    ) -> Notification:
        # Ленивый импорт EventPriority
        if priority is None:
            from app.api.sse import EventPriority
            priority = EventPriority.HIGH
        
        notification_id = f"{notification_type.value}-{uuid4().hex[:8]}"
        
        notification = Notification(
            id=notification_id,
            type=notification_type,
            title=title,
            message=message,
            created_at=datetime.utcnow().isoformat(),
            is_read=False,
            entity_type=entity_type,
            entity_id=entity_id
        )
        
        self._notifications[notification_id] = notification.model_dump()
        
        # Отправить через SSE если есть активный пользователь
        if self._current_user_id:
            import asyncio
            try:
                loop = asyncio.get_running_loop()
                asyncio.create_task(
                    _send_sse_event(
                        self._current_user_id,
                        "notification_new",
                        notification.model_dump(),
                        priority
                    )
                )
            except RuntimeError:
                # Нет event loop, откладываем отправку
                pass
        
        return notification
    
    def get_notifications(self, limit: int = 20, unread_only: bool = False) -> List[Notification]:
        notifications = list(self._notifications.values())
        
        if unread_only:
            notifications = [n for n in notifications if not n["is_read"]]
        
        notifications.sort(key=lambda x: x["created_at"], reverse=True)
        notifications = notifications[:limit]
        
        return [Notification(**n) for n in notifications]
    
    def mark_as_read(self, notification_id: str) -> bool:
        if notification_id in self._notifications:
            self._notifications[notification_id]["is_read"] = True
            
            # Отправить событие через SSE
            if self._current_user_id:
                import asyncio
                try:
                    loop = asyncio.get_running_loop()
                    asyncio.create_task(
                        _send_sse_event(
                            self._current_user_id,
                            "notification_read",
                            {"id": notification_id},
                            None
                        )
                    )
                except RuntimeError:
                    pass
            
            return True
        return False
    
    def mark_all_as_read(self) -> int:
        count = 0
        for notification in self._notifications.values():
            if not notification["is_read"]:
                notification["is_read"] = True
                count += 1
        
        # Отправить событие через SSE
        if self._current_user_id and count > 0:
            import asyncio
            try:
                loop = asyncio.get_running_loop()
                asyncio.create_task(
                    _send_sse_event(
                        self._current_user_id,
                        "notification_read_all",
                        {"count": count},
                        None
                    )
                )
            except RuntimeError:
                pass
        
        return count
    
    def get_unread_count(self) -> int:
        return sum(1 for n in self._notifications.values() if not n["is_read"])
    
    def delete_notification(self, notification_id: str) -> bool:
        if notification_id in self._notifications:
            del self._notifications[notification_id]
            return True
        return False
    
    def clear_all(self):
        self._notifications.clear()


notification_service = NotificationService()
