# RAG API - Vector Database Integration

## Обзор

Интеграция с Qdrant - векторной базой данных для реализации RAG (Retrieval-Augmented Generation) и семантического поиска.

## Возможности

- ✅ Создание и управление векторными коллекциями
- ✅ Загрузка векторов эмбеддингов с метаданными
- ✅ Семантический поиск по векторам
- ✅ Фильтрация результатов поиска
- ✅ Управление точками (CRUD операции)

## Конфигурация

### Переменные окружения

```bash
# URL Qdrant сервера
QDRANT_URL=http://qdrant:6333

# Размерность векторов (зависит от модели эмбеддингов)
VECTOR_SIZE=384  # Например, для all-MiniLM-L6-v2
```

### docker-compose

Qdrant уже добавлен в `docker-compose.yml`:

```yaml
qdrant:
  image: qdrant/qdrant:latest
  ports:
    - "6333:6333"
    - "6334:6334"
  volumes:
    - ./data/qdrant:/qdrant/storage
  restart: unless-stopped
```

## API Endpoints

### Коллекции

#### Создать коллекцию
```bash
POST /api/rag/collections
{
  "collection_name": "resumes",
  "vector_size": 384
}
```

#### Получить список коллекций
```bash
GET /api/rag/collections
```

#### Получить информацию о коллекции
```bash
GET /api/rag/collections/{collection_name}
```

#### Удалить коллекцию
```bash
DELETE /api/rag/collections/{collection_name}
```

### Векторы

#### Загрузить вектор
```bash
POST /api/rag/vectors
{
  "collection_name": "resumes",
  "point_id": "resume_001",
  "vector": [0.1, 0.2, ...],  // вектор эмбеддинга
  "payload": {
    "candidate_name": "Иван Иванов",
    "email": "ivan@example.com",
    "skills": ["Python", "FastAPI"],
    "experience_years": 5
  }
}
```

#### Поиск по вектору
```bash
POST /api/rag/vectors/search
{
  "collection_name": "resumes",
  "query_vector": [0.12, 0.34, ...],
  "limit": 5
}
```

#### Поиск с фильтром
```bash
POST /api/rag/vectors/search
{
  "collection_name": "resumes",
  "query_vector": [0.12, 0.34, ...],
  "limit": 5,
  "filter_field": "vacancy_id",
  "filter_value": 1
}
```

#### Получить вектор по ID
```bash
GET /api/rag/vectors/{collection_name}/{point_id}
```

#### Удалить векторы
```bash
DELETE /api/rag/vectors/{collection_name}
["point_id_1", "point_id_2"]
```

### Health Check

#### Проверка здоровья Qdrant
```bash
GET /api/rag/health
```

## Использование в коде

### Инициализация сервиса

```python
from app.services.vector.qdrant_service import qdrant_service

# Сервис автоматически инициализируется при импорте
```

### Создание коллекции

```python
qdrant_service.create_collection(
    collection_name="resumes",
    vector_size=384
)
```

### Загрузка векторов

```python
from qdrant_client.models import PointStruct

points = [
    PointStruct(
        id="resume_001",
        vector=[0.1, 0.2, ...],  # 384-мерный вектор
        payload={
            "candidate_name": "Иван Иванов",
            "skills": ["Python", "FastAPI"]
        }
    )
]

qdrant_service.upsert_points("resumes", points)
```

### Поиск

```python
# Базовый поиск
results = qdrant_service.search(
    collection_name="resumes",
    query_vector=query_vector,
    limit=5
)

# Поиск с фильтром
results = qdrant_service.search_with_filter(
    collection_name="resumes",
    query_vector=query_vector,
    field_name="vacancy_id",
    field_value=1,
    limit=5
)
```

## Пример интеграции с AI для генерации эмбеддингов

### Установка зависимостей

```bash
pip install sentence-transformers
```

### Генерация эмбеддингов

```python
from sentence_transformers import SentenceTransformer

# Загрузить предобученную модель
model = SentenceTransformer('all-MiniLM-L6-v2')

# Генерация вектора для текста
text = "Python разработчик с опытом 5 лет"
vector = model.encode(text).tolist()

# Загрузка в Qdrant
from app.services.vector.qdrant_service import qdrant_service
from qdrant_client.models import PointStruct

point = PointStruct(
    id="resume_001",
    vector=vector,
    payload={
        "text": text,
        "candidate_name": "Иван Иванов"
    }
)

qdrant_service.upsert_points("resumes", [point])
```

### Семантический поиск

```python
# Запрос
query = "Ищу Python разработчика"
query_vector = model.encode(query).tolist()

# Поиск
results = qdrant_service.search(
    collection_name="resumes",
    query_vector=query_vector,
    limit=5
)

for result in results:
    print(f"Score: {result['score']:.4f}")
    print(f"Candidate: {result['payload']['candidate_name']}")
    print(f"Skills: {result['payload']['skills']}")
```

## Сценарии использования в HR-платформе

### 1. Поиск подходящих кандидатов по вакансии

```python
# 1. Получить описание вакансии
vacancy_description = "Требуется Python разработчик с опытом работы в FastAPI и PostgreSQL"

# 2. Сгенерировать вектор запроса
query_vector = model.encode(vacancy_description).tolist()

# 3. Найти похожие резюме
results = qdrant_service.search(
    collection_name="resumes",
    query_vector=query_vector,
    limit=10
)

# 4. Получить кандидатов из результатов
for result in results:
    candidate_id = result['payload']['candidate_id']
    score = result['score']
    # Создать отклик с score
```

### 2. Группировка кандидатов по навыкам

```python
# Поиск кандидатов с Python навыками
results = qdrant_service.search_with_filter(
    collection_name="resumes",
    query_vector=python_vector,
    field_name="skills",
    field_value="Python",
    limit=20
)
```

### 3. RAG для генерации вопросов интервью

```python
# 1. Получить релевантные резюме
resume_contexts = qdrant_service.search(
    collection_name="resumes",
    query_vector=candidate_vector,
    limit=3
)

# 2. Использовать контекст для генерации вопросов через LLM
context_text = "\n".join([r['payload']['resume_text'] for r in resume_contexts])
prompt = f"Сгенерируйте вопросы для интервью на основе:\n{context_text}"

# 3. Отправить в LLM и получить вопросы
```

## Тестирование

### Запуск демо

```bash
cd backend
python test_rag_api.py
```

### Тесты через curl

```bash
# Проверка здоровья
curl http://localhost/api/rag/health

# Создание коллекции
curl -X POST http://localhost/api/rag/collections \
  -H "Content-Type: application/json" \
  -d '{"collection_name": "test", "vector_size": 384}'

# Поиск
curl -X POST http://localhost/api/rag/vectors/search \
  -H "Content-Type: application/json" \
  -d '{
    "collection_name": "test",
    "query_vector": [0.1] * 384,
    "limit": 5
  }'
```

## Архитектура

```
backend/app/
├── api/
│   └── rag.py                    # API endpoints для RAG
├── services/
│   └── vector/
│       ├── __init__.py
│       └── qdrant_service.py     # Сервис работы с Qdrant
└── config/
    └── settings.py               # Настройки Qdrant
```

## Дополнительные ресурсы

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Qdrant Client Python](https://github.com/qdrant/qdrant-client)
- [Sentence Transformers](https://www.sbert.net/)
