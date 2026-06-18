"""
Notification Service - Управление уведомлениями
"""
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from app.schemas import Notification, NotificationType


class NotificationService:
    """Сервис для управления уведомлениями"""
    
    def __init__(self):
        # Временное хранилище уведомлений (в продакшене использовать БД)
        self._notifications: dict[str, dict] = {}
    
    def create_notification(
        self,
        notification_type: NotificationType,
        title: str,
        message: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None
    ) -> Notification:
        """Создать новое уведомление"""
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
        return notification
    
    def get_notifications(
        self,
        limit: int = 20,
        unread_only: bool = False
    ) -> List[Notification]:
        """Получить список уведомлений"""
        notifications = list(self._notifications.values())
        
        # Фильтрация только непрочитанных
        if unread_only:
            notifications = [n for n in notifications if not n["is_read"]]
        
        # Сортировка по дате (новые сначала)
        notifications.sort(key=lambda x: x["created_at"], reverse=True)
        
        # Ограничение количества
        notifications = notifications[:limit]
        
        return [Notification(**n) for n in notifications]
    
    def mark_as_read(self, notification_id: str) -> bool:
        """Пометить уведомление как прочитанное"""
        if notification_id in self._notifications:
            self._notifications[notification_id]["is_read"] = True
            return True
        return False
    
    def mark_all_as_read(self) -> int:
        """Пометить все уведомления как прочитанные"""
        count = 0
        for notification_id, notification in self._notifications.items():
            if not notification["is_read"]:
                notification["is_read"] = True
                count += 1
        return count
    
    def get_unread_count(self) -> int:
        """Получить количество непрочитанных уведомлений"""
        return sum(1 for n in self._notifications.values() if not n["is_read"])
    
    def delete_notification(self, notification_id: str) -> bool:
        """Удалить уведомление"""
        if notification_id in self._notifications:
            del self._notifications[notification_id]
            return True
        return False
    
    def clear_all(self):
        """Очистить все уведомления"""
        self._notifications.clear()


# Глобальный экземпляр сервиса
notification_service = NotificationService()
