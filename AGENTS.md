# HR AI Platform — Agent Guidelines

## 📋 Проект

MVP HR-платформы со сквозным процессом подбора персонала, wizard-интерфейсом для создания вакансий и кандидатов, AI-парсингом резюме (PDF/DOC/DOCX/TXT) и PostgreSQL базой данных.

## 🏗️ Архитектура

### MVC структура Backend

```
backend/app/
├── models/              # Data Layer - SQLAlchemy модели
│   ├── __init__.py
│   └── db_models.py     # VacancyModel, CandidateModel, ApplicationModel
│
├── schemas/             # DTO Layer - Pydantic схемы
│   ├── __init__.py
│   ├── vacancy.py       # Vacancy, VacancyCreate, VacancyUpdate
│   ├── candidate.py     # Candidate, CandidateCreate, CandidateUpdate
│   ├── application.py   # Application, ApplicationCreate, StageUpdate
│   └── notification.py  # Notification, NotificationType
│
├── repositories/        # Data Access Layer - Репозитории
│   ├── __init__.py
│   ├── vacancy_repo.py       # CRUD вакансии
│   ├── candidate_repository.py  # CRUD кандидаты
│   └── application_repository.py  # CRUD отклики
│
├── services/            # Business Logic Layer - Сервисы
│   ├── __init__.py
│   ├── vacancy_service.py      # Бизнес-логика вакансий
│   ├── candidate_service.py    # Бизнес-логика кандидатов
│   ├── application_service.py  # Бизнес-логика откликов
│   ├── notification_service.py # Уведомления
│   ├── ai.py                   # AI анализ и вопросы
│   ├── mapper_service.py       # Маппинг моделей ↔ схем
│   └── text_service.py         # Утилиты для текста
│
├── api/                 # Controller Layer - API маршруты
│   ├── __init__.py
│   ├── router.py          # Главный router
│   ├── vacancies.py       # CRUD vacancies
│   ├── candidates.py      # CRUD candidates
│   ├── applications.py    # CRUD applications
│   ├── notifications.py   # CRUD notifications
│   ├── dashboard.py       # Статистика
│   └── auth.py            # Аутентификация
│
├── core/                # Configuration
│   ├── __init__.py
│   ├── config.py
│   └── security.py
│
├── database.py          # DB подключение
└── main.py              # FastAPI приложение
```

### Frontend структура

```
frontend/src/
├── components/
│   ├── VacancyWizard/       # 3-этапный wizard вакансий
│   ├── CandidateWizard/     # 3-этапный wizard с парсингом
│   └── layout/
│       ├── Sidebar.jsx      # Навигация
│       ├── Topbar.jsx       # Верхняя панель
│       ├── TopbarSearch.jsx # Поиск
│       └── TopbarNotifications.jsx # Уведомления
│
├── pages/
│   ├── Dashboard.jsx        # Дашборд
│   ├── Vacancies.jsx        # Список вакансий
│   ├── VacancyDetail/       # Детали вакансии
│   ├── Candidates.jsx       # Список кандидатов
│   ├── CandidateDetail/     # Детали кандидата
│   ├── RecruitmentFlow.jsx  # Pipeline откликов
│   └── Analytics.jsx        # Аналитика
│
├── api/
│   └── client.js            # API client (hrApi, notificationsApi)
│
├── __tests__/               # Тесты
│   ├── api/
│   ├── components/
│   └── pages/
│
└── App.jsx                  # Root с BrowserRouter
```

## 📊 Текущий статус (2026-01)

### ✅ Завершено
- **MVC архитектура** — чёткое разделение на слои (Models, Schemas, Repositories, Services, API)
- **React Router** — профессиональная навигация вместо hash-based
- **3-этапный Wizard для вакансий** — создание с AI-парсингом описания
- **3-этапный Wizard для кандидатов** — загрузка резюме с AI-извлечением данных
- **Компактные списки** — Vacancies и Candidates с детальными страницами
- **PostgreSQL** — полноценная БД вместо in-memory хранилища
- **AI-парсинг резюме** — поддержка PDF, DOC, DOCX, TXT форматов
- **Умное извлечение данных** — имя, email, телефон, опыт, навыки (25+ технологий)
- **Система уведомлений** — backend + frontend интеграция
  - Новые отклики
  - Изменение стадий
  - Закрытие вакансий
  - Готовность AI анализа
- **Юнит тесты** — backend (pytest) и frontend (vitest)
- **Интеграционные тесты сервисов** — покрытие нормализации данных и Service → Repository интеграции
- **Нормализация данных из БД** — автоматическое преобразование строк в списки для skills/required_skills

### 🔄 В работе
- Интеграция с реальным AI API для парсинга (сейчас mock данные)
- Расширение покрытия тестами
- End-to-end тестирование полного цикла

## 🧪 Тестирование

### Backend тесты

**Запуск:**
```bash
cd backend
pytest                    # Все тесты
pytest tests/unit/        # Юнит тесты
pytest tests/integration/ # Интеграционные тесты
pytest --cov=app          # С coverage
```

**Структура:**
```
backend/tests/
├── conftest.py              # Общие fixtures
├── unit/
│   ├── test_vacancy_service.py
│   ├── test_candidate_service.py
│   ├── test_application_service.py
│   └── test_services_integration.py  # Интеграционные тесты сервисов
└── integration/
    ├── test_api_vacancies.py
    ├── test_api_candidates.py
    └── test_api_applications.py
```

**Интеграционные тесты сервисов** (`tests/unit/test_services_integration.py`):
- Проверяют нормализацию данных из БД (строки → списки)
- Тестируют Service → Repository интеграцию
- Покрывают DashboardService
- Поймают проблемы с API репозиториев при рефакторинге

### Frontend тесты

**Запуск:**
```bash
cd frontend
npm run test                # Все тесты (watch mode)
npm run test:run            # Один запуск
npm run test:coverage       # С coverage
```

**Структура:**
```
frontend/src/__tests__/
├── setup.js                 # Test setup
├── api/
│   └── client.test.js       # API client тесты
├── components/
│   └── VacancyWizard.test.jsx
└── pages/
    └── Vacancies.test.jsx
```

## 🛠️ Technology stack

### Backend
- **Framework**: FastAPI 0.115.6
- **Runtime**: Python 3.12+
- **Validation**: Pydantic 2.10
- **Server**: Uvicorn 0.34
- **Database**: PostgreSQL 15+ (alembic migrations)
- **Testing**: pytest, pytest-cov, pytest-asyncio

### Frontend
- **Framework**: React 18
- **Router**: React Router DOM 7+
- **Build**: Vite 8
- **Icons**: Lucide React
- **HTTP Client**: Axios (через hrApi)
- **File Parsing**: pdf-parse, mammoth (для резюме)
- **Testing**: Vitest, @testing-library/react

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx 1.27
- **Object Storage**: MinIO (для резюме/файлов)
- **Database**: PostgreSQL

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` — mock login (дефолтный логин: `depopova`)

### Vacancies
- `POST /api/vacancies` — создать вакансию
- `GET /api/vacancies` — список вакансий
- `GET /api/vacancies/{id}` — детальная информация
- `PATCH /api/vacancies/{id}` — обновить вакансию
- `DELETE /api/vacancies/{id}` — удалить вакансию
- `PATCH /api/vacancies/{id}/close` — закрыть вакансию

### Candidates
- `POST /api/candidates` — создать кандидата
- `GET /api/candidates` — список кандидатов
- `GET /api/candidates/{id}` — детальная информация
- `PATCH /api/candidates/{id}` — обновить кандидата
- `DELETE /api/candidates/{id}` — удалить кандидата

### Applications
- `POST /api/applications` — создать отклик
- `GET /api/applications` — список откликов
- `POST /api/applications/{id}/analyze` — AI-анализ отклика
- `PATCH /api/applications/{id}/stage` — обновить stage pipeline
- `GET /api/applications/{id}/interview-questions` — получить AI-вопросы

### Notifications
- `GET /api/notifications` — список уведомлений
- `GET /api/notifications/unread-count` — счётчик непрочитанных
- `POST /api/notifications/{id}/read` — пометить как прочитанное
- `POST /api/notifications/read-all` — пометить все как прочитанные
- `DELETE /api/notifications/{id}` — удалить уведомление

### Dashboard
- `GET /api/dashboard` — сводная статистика

### Demo
- `POST /api/demo-seed` — создать demo данные

## 📐 Data Models

### Vacancy
```python
{
    id: int
    title: str
    department: str
    description: str
    required_skills: List[str]
    salary_from: Optional[int]
    salary_to: Optional[int]
    status: "open" | "closed"
}
```

### Candidate
```python
{
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    skills: List[str]
    experience_years: Optional[int]
    resume_text: str
}
```

### Application
```python
{
    id: int
    candidate_id: int
    vacancy_id: int
    stage: "new" | "screening" | "interview" | "offer" | "hired" | "rejected"
    ai_analysis: Optional[AiAnalysis]
}
```

### Notification
```python
{
    id: str
    type: "application_new" | "vacancy_closed" | "application_stage_changed" | "ai_analysis_ready"
    title: str
    message: str
    created_at: str
    is_read: bool
    entity_type: Optional[str]
    entity_id: Optional[int]
}
```

## 🤖 AI Logic

### Парсинг резюме (Frontend)
**Поддерживаемые форматы:**
- PDF (через pdf-parse)
- DOC/DOCX (через mammoth)
- TXT (нативное чтение)

**Извлекаемые данные:**
1. **Имя**: Первая непустая строка (< 50 символов, без @ и http)
2. **Email**: Regex `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`
3. **Телефон**: Regex `(\+?\d[\d\s-]{8,}\d)`
4. **Опыт работы**: Regex `(\d+)\s*[ллет]+`
5. **Навыки**: Автоматическое обнаружение 25+ технологий:
   - Python, Java, JavaScript, TypeScript, React, Vue, Angular
   - Node.js, Django, Flask, FastAPI, Spring, PHP, C#, Go
   - PostgreSQL, MySQL, MongoDB, Redis
   - Docker, Kubernetes, AWS, Azure, Git, Linux
   - HTML, CSS, SASS

### Анализ кандидата (Backend)
1. Нормализация навыков (lowercase)
2. Поиск пересечений между навыками кандидата и требованиями вакансии
3. Расчёт score: `len(matched) / len(required) * 100`
4. Генерация рекомендации на основе score:
   - ≥80%: "хорошо подходит"
   - ≥50%: "частично подходит"
   - <50%: "слабо подходит"

### Генерация вопросов
- По 2 вопроса на каждый требуемый навык
- 1 общий вопрос о соответствии позиции
- Максимум 8 вопросов

## 🚀 Development

### Запуск через Docker
```bash
docker-compose up
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- MinIO Console: http://localhost:9001
- Nginx: http://localhost:80
- OpenAPI docs: http://localhost:8000/docs

### Локальный запуск

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Тесты Backend:**
```bash
cd backend
pytest --cov=app
```

**Тесты Frontend:**
```bash
cd frontend
npm run test
```

### Login для демо
- Логин: `depopova`
- Пароль: не требуется (mock)

## 📝 Правила для агентов

### При работе с кодом

1. **Понимать контекст**: Прочитать AGENTS.md, ARCHITECTURE.md, CONTRIBUTING.md
2. **Следовать MVC**: Размещать код в правильном слое
   - Models → `models/db_models.py`
   - Schemas → `schemas/*.py`
   - Repositories → `repositories/*_repo.py`
   - Services → `services/*_service.py`
   - API → `api/*.py`
3. **Писать тесты**: Для каждой новой функции писать юнит тесты
4. **Документировать**: Добавлять docstrings для функций и классов
5. **Использовать type hints**: Обязательно для backend
6. **Проверять**: Запускать тесты перед завершением задачи

### При создании новых сущностей

1. Создать модель в `models/db_models.py`
2. Создать схемы в `schemas/`
3. Создать репозиторий в `repositories/`
4. Создать сервис в `services/`
5. Создать API контроллер в `api/`
6. Подключить в `api/router.py`
7. Написать юнит тесты в `tests/unit/`
8. Написать интеграционные тесты в `tests/integration/`
9. Обновить документацию

### При исправлении багов

1. Воспроизвести баг
2. Написать тест, который падает (**если теста нет — создать!** )
3. Исправить код
4. Убедиться что тест проходит
5. Проверить что другие тесты не сломались
6. **Добавить тест в интеграционные тесты если баг был в Service → Repository слое**

### Нормализация данных из БД

**Проблема:** Данные в PostgreSQL хранятся как строки (`"Python,Django"`), а Pydantic ожидает списки (`["Python", "Django"]`).

**Решение:** В каждом сервисе добавить метод нормализации:

```python
# services/vacancy/service.py
@staticmethod
def _normalize_vacancy(vacancy) -> dict:
    """Преобразовать SQLAlchemy модель в dict и нормализовать required_skills"""
    if hasattr(vacancy, '__dict__'):
        vacancy = {k: v for k, v in vacancy.__dict__.items() if not k.startswith('_')}
    
    if isinstance(vacancy, dict):
        skills = vacancy.get('required_skills', [])
        if isinstance(skills, str):
            vacancy = vacancy.copy()
            vacancy['required_skills'] = [s.strip() for s in skills.split(',') if s.strip()]
    return vacancy
```

**Важно:** Всегда проверять что Repository возвращает (SQLAlchemy модель или dict) перед нормализацией!

### Коммиты

Использовать семантические коммиты:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Типы:**
- `feat`: Новая функция
- `fix`: Исправление бага
- `docs`: Документация
- `refactor`: Рефакторинг
- `test`: Добавление тестов
- `chore`: Изменения инструментов

**Примеры:**
```bash
feat(vacancies): добавить фильтрацию по отделу
fix(application): исправить ошибку при анализе
refactor(architecture): переход на MVC структуру
test(vacancy): добавить юнит тесты для сервиса
```

## 📚 Документация

- `README.md` — общее описание проекта
- `CONTRIBUTING.md` — правила вклада и разработки
- `backend/app/ARCHITECTURE.md` — архитектура backend
- `docs/` — дополнительная документация (AsciiDoc)

## 🎯 Build roadmap

1. ✅ Project bootstrap
2. ✅ Application layout
3. ✅ Dashboard
4. ✅ Vacancy management (с Wizard)
5. ✅ Candidate management (с парсингом резюме)
6. ✅ Application pipeline
7. ✅ AI candidate analysis
8. ✅ Interview assistant
9. ✅ Analytics
10. ✅ Demo scenario
11. ✅ Notification system
12. ✅ MVC refactoring
13. ✅ Unit tests
14. ✅ Интеграционные тесты сервисов (нормализация данных)
15. 🔄 Real AI API integration
16. 🔄 Integration tests (API layer)
17. 🔄 E2E tests
18. 🔄 Advanced analytics
19. 🔄 Email notifications
