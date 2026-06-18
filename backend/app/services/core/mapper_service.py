"""Mapper Service - Утилиты для маппинга"""
from typing import TypeVar, Type
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)
M = TypeVar('M')


class MapperService:
    """Сервис для маппинга между объектами"""
    
    @staticmethod
    def map_to_schema(model: M, schema_class: Type[T]) -> T:
        """Преобразовать модель в схему"""
        return schema_class.model_validate(model)
    
    @staticmethod
    def map_to_dict(model: M) -> dict:
        """Преобразовать модель в словарь"""
        if hasattr(model, 'model_dump'):
            return model.model_dump()
        elif hasattr(model, '__dict__'):
            return model.__dict__
        return {}


# Глобальный экземпляр
mapper_service = MapperService()
