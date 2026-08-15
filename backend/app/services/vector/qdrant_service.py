"""Qdrant vector database client and operations"""
import logging
from typing import Any
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    SearchParams,
)

from app.config.settings import settings

logger = logging.getLogger(__name__)


class QdrantService:
    """Сервис для работы с Qdrant векторной базой данных"""
    
    def __init__(self):
        """Инициализация клиента Qdrant"""
        self.qdrant_url = settings.qdrant_url or "http://qdrant:6333"
        self.client = QdrantClient(url=self.qdrant_url)
        logger.info(f"Qdrant client initialized: {self.qdrant_url}")
    
    def create_collection(
        self,
        collection_name: str,
        vector_size: int,
        distance: Distance = Distance.COSINE
    ) -> bool:
        """
        Создать коллекцию в Qdrant
        
        Args:
            collection_name: Имя коллекции
            vector_size: Размерность вектора
            distance: Метрика расстояния (COSINE, EUCLIDEAN, DOT)
        
        Returns:
            True если коллекция создана успешно
        """
        try:
            # Проверить существует ли коллекция
            collections = self.client.get_collections().collections
            if any(c.name == collection_name for c in collections):
                logger.info(f"Collection '{collection_name}' already exists")
                return True
            
            # Создать новую коллекцию
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=distance
                )
            )
            logger.info(f"Collection '{collection_name}' created successfully")
            return True
        except Exception as e:
            logger.error(f"Error creating collection '{collection_name}': {e}")
            raise
    
    def upsert_points(
        self,
        collection_name: str,
        points: list[PointStruct]
    ) -> bool:
        """
        Добавить или обновить точки в коллекции
        
        Args:
            collection_name: Имя коллекции
            points: Список точек с векторами и данными
        
        Returns:
            True если точки добавлены успешно
        """
        try:
            self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            logger.info(f"Successfully upserted {len(points)} points to '{collection_name}'")
            return True
        except Exception as e:
            logger.error(f"Error upserting points to '{collection_name}': {e}")
            raise
    
    def search(
        self,
        collection_name: str,
        query_vector: list[float],
        limit: int = 5,
        filter_conditions: Filter | None = None
    ) -> list[dict]:
        """
        Поиск по вектору в коллекции
        
        Args:
            collection_name: Имя коллекции
            query_vector: Запросный вектор
            limit: Максимальное количество результатов
            filter_conditions: Фильтры для поиска
        
        Returns:
            Список результатов поиска с баллами и данными
        """
        try:
            results = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                query_filter=filter_conditions,
                search_params=SearchParams(
                    hnsw_ef=128,
                    exact=False
                )
            )
            
            # Преобразовать результаты в словарь
            return [
                {
                    "id": point.id,
                    "score": point.score,
                    "payload": point.payload,
                }
                for point in results
            ]
        except Exception as e:
            logger.error(f"Error searching in '{collection_name}': {e}")
            raise
    
    def search_with_filter(
        self,
        collection_name: str,
        query_vector: list[float],
        field_name: str,
        field_value: Any,
        limit: int = 5
    ) -> list[dict]:
        """
        Поиск с фильтром по полю
        
        Args:
            collection_name: Имя коллекции
            query_vector: Запросный вектор
            field_name: Имя поля для фильтра
            field_value: Значение для фильтра
            limit: Максимальное количество результатов
        
        Returns:
            Список результатов поиска
        """
        try:
            filter_conditions = Filter(
                must=[
                    FieldCondition(
                        key=field_name,
                        match=MatchValue(value=field_value)
                    )
                ]
            )
            
            return self.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                filter_conditions=filter_conditions
            )
        except Exception as e:
            logger.error(f"Error searching with filter in '{collection_name}': {e}")
            raise
    
    def get_points(
        self,
        collection_name: str,
        point_ids: list
    ) -> list[dict]:
        """
        Получить точки по ID
        
        Args:
            collection_name: Имя коллекции
            point_ids: Список ID точек
        
        Returns:
            Список точек
        """
        try:
            points = self.client.retrieve(
                collection_name=collection_name,
                ids=point_ids,
                with_payload=True,
                with_vectors=False
            )
            
            return [
                {
                    "id": point.id,
                    "payload": point.payload,
                    "vector": point.vector,
                }
                for point in points
            ]
        except Exception as e:
            logger.error(f"Error retrieving points from '{collection_name}': {e}")
            raise
    
    def delete_points(
        self,
        collection_name: str,
        point_ids: list
    ) -> bool:
        """
        Удалить точки из коллекции
        
        Args:
            collection_name: Имя коллекции
            point_ids: Список ID точек для удаления
        
        Returns:
            True если точки удалены успешно
        """
        try:
            self.client.delete(
                collection_name=collection_name,
                points_selector=point_ids
            )
            logger.info(f"Successfully deleted {len(point_ids)} points from '{collection_name}'")
            return True
        except Exception as e:
            logger.error(f"Error deleting points from '{collection_name}': {e}")
            raise
    
    def delete_collection(self, collection_name: str) -> bool:
        """
        Удалить коллекцию
        
        Args:
            collection_name: Имя коллекции
        
        Returns:
            True если коллекция удалена успешно
        """
        try:
            self.client.delete_collection(collection_name=collection_name)
            logger.info(f"Collection '{collection_name}' deleted successfully")
            return True
        except Exception as e:
            logger.error(f"Error deleting collection '{collection_name}': {e}")
            raise
    
    def get_collection_info(self, collection_name: str) -> dict | None:
        """
        Получить информацию о коллекции
        
        Args:
            collection_name: Имя коллекции
        
        Returns:
            Словарь с информацией о коллекции или None
        """
        try:
            info = self.client.get_collection(collection_name=collection_name)
            return {
                "name": info.name,
                "vectors_count": info.vectors_count,
                "status": info.status,
                "optimizer_status": info.optimizer_status,
            }
        except Exception as e:
            logger.error(f"Error getting collection info '{collection_name}': {e}")
            return None
    
    def list_collections(self) -> list[str]:
        """
        Получить список всех коллекций
        
        Returns:
            Список названий коллекций
        """
        try:
            collections = self.client.get_collections().collections
            return [c.name for c in collections]
        except Exception as e:
            logger.error(f"Error listing collections: {e}")
            raise


# Глобальный экземпляр сервиса
qdrant_service = QdrantService()
