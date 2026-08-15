"""
RAG API - Тестовые примеры для работы с Qdrant

Примеры использования API для векторного поиска и RAG (Retrieval-Augmented Generation)
"""
import requests
import json

# Базовый URL API
BASE_URL = "http://localhost/api"


def test_qdrant_health():
    """Проверка здоровья Qdrant"""
    response = requests.get(f"{BASE_URL}/rag/health")
    print("=== Qdrant Health ===")
    print(json.dumps(response.json(), indent=2))
    return response.json()


def create_collection(collection_name: str = "resumes", vector_size: int = 384):
    """Создать коллекцию"""
    response = requests.post(
        f"{BASE_URL}/rag/collections",
        json={"collection_name": collection_name, "vector_size": vector_size}
    )
    print(f"\n=== Create Collection: {collection_name} ===")
    print(json.dumps(response.json(), indent=2))
    return response.json()


def list_collections():
    """Получить список коллекций"""
    response = requests.get(f"{BASE_URL}/rag/collections")
    print("\n=== List Collections ===")
    print(json.dumps(response.json(), indent=2))
    return response.json()


def upload_vector(collection_name: str, point_id: str, vector: list, payload: dict):
    """Загрузить вектор"""
    response = requests.post(
        f"{BASE_URL}/rag/vectors",
        json={
            "collection_name": collection_name,
            "point_id": point_id,
            "vector": vector,
            "payload": payload
        }
    )
    print(f"\n=== Upload Vector: {point_id} ===")
    print(json.dumps(response.json(), indent=2))
    return response.json()


def search_vectors(collection_name: str, query_vector: list, limit: int = 3):
    """Поиск по вектору"""
    response = requests.post(
        f"{BASE_URL}/rag/vectors/search",
        json={
            "collection_name": collection_name,
            "query_vector": query_vector,
            "limit": limit
        }
    )
    print(f"\n=== Search Vectors ===")
    print(json.dumps(response.json(), indent=2))
    return response.json()


def search_with_filter(collection_name: str, query_vector: list, filter_field: str, filter_value: str, limit: int = 3):
    """Поиск с фильтром"""
    response = requests.post(
        f"{BASE_URL}/rag/vectors/search",
        json={
            "collection_name": collection_name,
            "query_vector": query_vector,
            "limit": limit,
            "filter_field": filter_field,
            "filter_value": filter_value
        }
    )
    print(f"\n=== Search with Filter ({filter_field}={filter_value}) ===")
    print(json.dumps(response.json(), indent=2))
    return response.json()


def get_vector(collection_name: str, point_id: str):
    """Получить вектор по ID"""
    response = requests.get(f"{BASE_URL}/rag/vectors/{collection_name}/{point_id}")
    print(f"\n=== Get Vector: {point_id} ===")
    print(json.dumps(response.json(), indent=2))
    return response.json()


def delete_vectors(collection_name: str, point_ids: list):
    """Удалить векторы"""
    response = requests.delete(
        f"{BASE_URL}/rag/vectors/{collection_name}",
        json=point_ids
    )
    print(f"\n=== Delete Vectors ===")
    print(json.dumps(response.json(), indent=2))
    return response.json()


def delete_collection(collection_name: str):
    """Удалить коллекцию"""
    response = requests.delete(f"{BASE_URL}/rag/collections/{collection_name}")
    print(f"\n=== Delete Collection: {collection_name} ===")
    print(json.dumps(response.json(), indent=2))
    return response.json()


def run_demo():
    """Запустить демонстрацию"""
    print("=" * 60)
    print("RAG API Demo - Qdrant Vector Database")
    print("=" * 60)
    
    # 1. Проверка здоровья
    health = test_qdrant_health()
    if health.get("status") != "healthy":
        print("\n❌ Qdrant is not healthy. Please check if Qdrant is running.")
        return
    
    # 2. Создать коллекцию
    create_collection("demo-resumes", vector_size=384)
    
    # 3. Загрузить тестовые векторы (симуляция эмбеддингов)
    # В реальности эти векторы генерируются моделью типа sentence-transformers
    test_vectors = [
        {
            "point_id": "resume_001",
            "vector": [0.1] * 384,  # Симуляция вектора
            "payload": {
                "candidate_name": "Иван Иванов",
                "email": "ivan@example.com",
                "skills": ["Python", "FastAPI", "PostgreSQL"],
                "experience_years": 5,
                "vacancy_id": 1
            }
        },
        {
            "point_id": "resume_002",
            "vector": [0.2] * 384,
            "payload": {
                "candidate_name": "Петр Петров",
                "email": "petr@example.com",
                "skills": ["JavaScript", "React", "Node.js"],
                "experience_years": 3,
                "vacancy_id": 2
            }
        },
        {
            "point_id": "resume_003",
            "vector": [0.15] * 384,
            "payload": {
                "candidate_name": "Анна Сидорова",
                "email": "anna@example.com",
                "skills": ["Python", "Django", "Machine Learning"],
                "experience_years": 4,
                "vacancy_id": 1
            }
        }
    ]
    
    for tv in test_vectors:
        upload_vector("demo-resumes", tv["point_id"], tv["vector"], tv["payload"])
    
    # 4. Поиск по вектору (симуляция поиска похожего резюме)
    query_vector = [0.12] * 384  # Симуляция запросного вектора
    search_vectors("demo-resumes", query_vector, limit=2)
    
    # 5. Поиск с фильтром (например, только для vacancy_id=1)
    search_with_filter("demo-resumes", query_vector, "vacancy_id", 1, limit=2)
    
    # 6. Получить конкретный вектор
    get_vector("demo-resumes", "resume_001")
    
    # 7. Удалить векторы
    delete_vectors("demo-resumes", ["resume_001", "resume_002", "resume_003"])
    
    # 8. Удалить коллекцию
    delete_collection("demo-resumes")
    
    print("\n" + "=" * 60)
    print("✅ Demo completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    run_demo()
