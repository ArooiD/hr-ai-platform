"""Notification schemas"""
from typing import Optional
from enum import Enum
from pydantic import BaseModel


class NotificationType(str, Enum):
    APPLICATION_NEW = "application_new"
    VACANCY_CLOSED = "vacancy_closed"
    VACANCY_REOPENED = "vacancy_reopened"
    APPLICATION_STAGE_CHANGED = "application_stage_changed"
    AI_ANALYSIS_READY = "ai_analysis_ready"


class Notification(BaseModel):
    id: str
    type: NotificationType
    title: str
    message: str
    created_at: str
    is_read: bool
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
