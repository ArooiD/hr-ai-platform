"""RAG API endpoints - Retrieval-Augmented Generation"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.services.vector.qdrant_service import qdrant_service
from qdrant_client.models import PointStruct

router = APIRouter(prefix="/rag", tags=["RAG"])


# --- Schemas ---
class VectorUpload(BaseModel):
    """Загрузка вектора в Qdrant"""
    collection_name: str
    point_id: str
    vector: list[float]
    payload: Optional[dict] = None


class VectorSearch(BaseModel):
    """Поиск по вектору"""
    collection_name: str
    query_vector: list[float]
    limit: int = 5
    filter_field: Optional[str] = None
    filter_value: Optional[str] = None


class VectorSearchResponse(BaseModel):
    """Ответ поиска по вектору"""
    id: str
    score: float
    payload: dict


class CollectionCreate(BaseModel):
    """Создание коллекции"""
    collection_name: str
    vector_size: int = 384


class CollectionInfo(BaseModel):
    """Информация о коллекции"""
    name: str
    vectors_count: int
    status: str


# --- Endpoints ---
@router.post("/collections")
async def create_collection(collection: CollectionCreate):
    """
    Создать новую коллекцию в Qdrant
    
    - **collection_name**: Имя коллекции
    - **vector_size**: Размерность векторов (по умолчанию 384)
    """
    try:
        qdrant_service.create_collection(
            collection_name=collection.collection_name,
            vector_size=collection.vector_size
        )
        return {
            "status": "success",
            "message": f"Collection '{collection.collection_name}' created",
            "collection_name": collection.collection_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collections")
async def list_collections():
    """Получить список всех коллекций"""
    try:
        collections = qdrant_service.list_collections()
        return {
            "status": "success",
            "collections": collections,
            "count": len(collections)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/collections/{collection_name}")
async def get_collection_info(collection_name: str):
    """Получить информацию о коллекции"""
    try:
        info = qdrant_service.get_collection_info(collection_name)
        if not info:
            raise HTTPException(status_code=404, detail="Collection not found")
        return info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/collections/{collection_name}")
async def delete_collection(collection_name: str):
    """Удалить коллекцию"""
    try:
        qdrant_service.delete_collection(collection_name)
        return {
            "status": "success",
            "message": f"Collection '{collection_name}' deleted"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vectors")
async def upload_vector(vector_data: VectorUpload):
    """
    Загрузить вектор в коллекцию
    
    - **collection_name**: Имя коллекции
    - **point_id**: Уникальный ID точки
    - **vector**: Вектор эмбеддинга
    - **payload**: Дополнительные данные (опционально)
    """
    try:
        point = PointStruct(
            id=vector_data.point_id,
            vector=vector_data.vector,
            payload=vector_data.payload or {}
        )
        
        qdrant_service.upsert_points(
            collection_name=vector_data.collection_name,
            points=[point]
        )
        
        return {
            "status": "success",
            "message": "Vector uploaded successfully",
            "point_id": vector_data.point_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vectors/search", response_model=list[VectorSearchResponse])
async def search_vectors(search_data: VectorSearch):
    """
    Поиск по вектору в коллекции
    
    - **collection_name**: Имя коллекции
    - **query_vector**: Запросный вектор
    - **limit**: Максимальное количество результатов (по умолчанию 5)
    - **filter_field**: Поле для фильтрации (опционально)
    - **filter_value**: Значение для фильтрации (опционально)
    """
    try:
        if search_data.filter_field and search_data.filter_value:
            results = qdrant_service.search_with_filter(
                collection_name=search_data.collection_name,
                query_vector=search_data.query_vector,
                field_name=search_data.filter_field,
                field_value=search_data.filter_value,
                limit=search_data.limit
            )
        else:
            results = qdrant_service.search(
                collection_name=search_data.collection_name,
                query_vector=search_data.query_vector,
                limit=search_data.limit
            )
        
        return [
            VectorSearchResponse(
                id=str(r["id"]),
                score=r["score"],
                payload=r["payload"]
            )
            for r in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vectors/{collection_name}/{point_id}")
async def get_vector(collection_name: str, point_id: str):
    """Получить вектор по ID"""
    try:
        points = qdrant_service.get_points(collection_name, [point_id])
        if not points:
            raise HTTPException(status_code=404, detail="Point not found")
        return points[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/vectors/{collection_name}")
async def delete_vectors(collection_name: str, point_ids: list[str]):
    """Удалить векторы по ID"""
    try:
        qdrant_service.delete_points(collection_name, point_ids)
        return {
            "status": "success",
            "message": f"Deleted {len(point_ids)} vectors",
            "deleted_ids": point_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Проверка здоровья Qdrant"""
    try:
        collections = qdrant_service.list_collections()
        return {
            "status": "healthy",
            "qdrant_url": qdrant_service.qdrant_url,
            "collections_count": len(collections),
            "collections": collections
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Qdrant error: {str(e)}")
