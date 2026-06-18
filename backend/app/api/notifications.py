"""
Notifications API - Маршруты для уведомлений
"""
from typing import List
from fastapi import APIRouter, HTTPException

from app.schemas import Notification
from app.services.notification.service import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[Notification])
async def get_notifications(
    limit: int = 20,
    unread_only: bool = False
):
    """
    Получить список уведомлений
    
    - **limit**: Максимальное количество уведомлений (по умолчанию 20)
    - **unread_only**: Только непрочитанные уведомления
    """
    notifications = notification_service.get_notifications(
        limit=limit,
        unread_only=unread_only
    )
    return notifications


@router.get("/unread-count")
async def get_unread_count():
    """
    Получить количество непрочитанных уведомлений
    """
    count = notification_service.get_unread_count()
    return {"count": count}


@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str):
    """
    Пометить уведомление как прочитанное
    
    - **notification_id**: ID уведомления
    """
    success = notification_service.mark_as_read(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    return {"success": True}


@router.post("/read-all")
async def mark_all_as_read():
    """
    Пометить все уведомления как прочитанные
    """
    count = notification_service.mark_all_as_read()
    return {"success": True, "marked_count": count}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    """
    Удалить уведомление
    
    - **notification_id**: ID уведомления
    """
    success = notification_service.delete_notification(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    return {"success": True}
