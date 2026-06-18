"""Notification Service - Управление уведомлениями"""
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from app.schemas import Notification, NotificationType


class NotificationService:
    """Сервис для управления уведомлениями"""
    
    def __init__(self):
        self._notifications: dict[str, dict] = {}
    
    def create_notification(
        self,
        notification_type: NotificationType,
        title: str,
        message: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None
    ) -> Notification:
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
            return True
        return False
    
    def mark_all_as_read(self) -> int:
        count = 0
        for notification in self._notifications.values():
            if not notification["is_read"]:
                notification["is_read"] = True
                count += 1
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
