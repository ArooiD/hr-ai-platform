"""Pagination utilities for RESTful API"""
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Стандартный ответ с пагинацией"""
    data: List[T]
    total: int
    page: int
    per_page: int
    pages: int
    has_next: bool
    has_prev: bool
    
    class Config:
        json_schema_extra = {
            "example": {
                "data": [],
                "total": 100,
                "page": 1,
                "per_page": 10,
                "pages": 10,
                "has_next": True,
                "has_prev": False
            }
        }


def paginate(
    items: List[Any],
    page: int = 1,
    per_page: int = 20,
    total: Optional[int] = None
) -> PaginatedResponse:
    """
    Пагинировать список элементов
    
    Args:
        items: Список элементов
        page: Номер страницы (начинается с 1)
        per_page: Элементов на странице
        total: Общее количество (если None, считается из items)
    
    Returns:
        PaginatedResponse с данными и метаданными
    """
    # Ограничиваем параметры
    page = max(1, page)
    per_page = min(max(1, per_page), 100)  # Макс 100 элементов на страницу
    
    total = total or len(items)
    pages = (total + per_page - 1) // per_page  # Ceiling division
    
    # Вычисляем смещение
    offset = (page - 1) * per_page
    paginated_items = items[offset:offset + per_page]
    
    return PaginatedResponse(
        data=paginated_items,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1
    )


class PaginationParams(BaseModel):
    """Параметры пагинации для запроса"""
    page: int = Field(default=1, ge=1, description="Номер страницы")
    per_page: int = Field(default=20, ge=1, le=100, description="Элементов на странице")


class FilterParams(BaseModel):
    """Базовые параметры фильтрации"""
    search: Optional[str] = Field(default=None, description="Поисковый запрос")
    status: Optional[str] = Field(default=None, description="Фильтр по статусу")
    order_by: Optional[str] = Field(default="id", description="Сортировка")
    order: Optional[str] = Field(default="asc", description="Порядок сортировки (asc/desc)")
