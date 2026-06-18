# Backend Архитектура - MVC структура

## 📁 Структура проекта

```
backend/app/
├── models/              # Data Layer - Модели БД
│   ├── __init__.py
│   └── db_models.py     # SQLAlchemy модели (VacancyModel, CandidateModel, ApplicationModel)
│
├── schemas/             # DTO Layer - Pydantic схемы
│   ├── __init__.py
│   ├── vacancy.py       # Схемы для вакансий
│   ├── candidate.py     # Схемы для кандидатов
│   ├── application.py   # Схемы для откликов
│   └── notification.py  # Схемы для уведомлений
│
├── repositories/        # Data Access Layer - Репозитории
│   ├── __init__.py
│   ├── vacancy_repo.py       # CRUD для вакансий
│   ├── candidate_repository.py  # CRUD для кандидатов
│   └── application_repository.py  # CRUD для откликов
│
├── services/            # Business Logic Layer - Сервисы
│   ├── __init__.py
│   ├── vacancy_service.py      # Бизнес-логика вакансий
│   ├── candidate_service.py    # Бизнес-логика кандидатов
│   ├── application_service.py  # Бизнес-логика откликов
│   ├── notification_service.py # Сервис уведомлений
│   ├── ai.py                   # AI функции (анализ, вопросы)
│   ├── mapper_service.py       # Маппинг между моделями и схемами
│   └── text_service.py         # Утилиты для работы с текстом
│
├── api/               # Controller Layer - API маршруты
│   ├── __init__.py
│   ├── router.py          # Главный router
│   ├── vacancies.py       # CRUD вакансии
│   ├── candidates.py      # CRUD кандидаты
│   ├── applications.py    # CRUD отклики
│   ├── notifications.py   # CRUD уведомления
│   ├── dashboard.py       # Статистика
│   └── auth.py            # Аутентификация
│
├── core/              # Core/Configuration
│   ├── __init__.py
│   ├── config.py        # Настройки (Pydantic Settings)
│   └── security.py      # Auth утилиты
│
├── database.py        # DB подключение
└── main.py            # FastAPI приложение
```

## 🏗️ Слои архитектуры

### 1. **Models Layer** (Data)
- SQLAlchemy модели
- Отображение таблиц БД
- Relationships между таблицами

### 2. **Schemas Layer** (DTO)
- Pydantic модели
- Валидация входных/выходных данных
- OpenAPI документация

### 3. **Repositories Layer** (Data Access)
- Прямая работа с БД через SQLAlchemy
- CRUD операции
- Запросы и фильтрация

### 4. **Services Layer** (Business Logic)
- Бизнес-правила
- Оркестрация между репозиториями
- Создание уведомлений
- AI анализ

### 5. **API Layer** (Controllers)
- HTTP маршруты
- Request/Response обработка
- Dependency injection
- Валидация через FastAPI

## 📝 Пример потока данных

### Создание отклика:

```
POST /api/applications
    ↓
api/applications.py (Controller)
    ↓
services/application_service.py (Business Logic)
    ├→ Проверка кандидата (repositories/candidate_repository.py)
    ├→ Проверка вакансии (repositories/vacancy_repo.py)
    ├→ Создание отклика (repositories/application_repository.py)
    └→ Создание уведомления (services/notification_service.py)
    ↓
schemas/application.py (DTO валидация)
    ↓
JSON Response
```

## 🎯 Принципы организации

1. **Separation of Concerns** — каждый слой отвечает за свою задачу
2. **Dependency Direction** — зависимости только вниз (API → Services → Repositories → Models)
3. **Single Responsibility** — каждый файл решает одну задачу
4. **Testability** — слои можно тестировать независимо

## 🔧 Добавление новой сущности

1. **Model** — создать в `models/db_models.py`
2. **Schema** — создать файл в `schemas/`
3. **Repository** — создать файл в `repositories/`
4. **Service** — создать файл в `services/`
5. **API** — создать файл в `api/` и подключить в `api/router.py`

## 📚 Документация

- **OpenAPI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
