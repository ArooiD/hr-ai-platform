# HR AI Platform — Agent Guidelines

## Проект

MVP HR-платформы со сквозным процессом подбора персонала и мокнутым AI-функционалом.

## Структура проекта

```
hr-ai-platform/
├── backend/                 # FastAPI backend
│   └── app/
│       ├── main.py         # Основные API endpoints
│       ├── ai_service.py   # AI-логика (анализ кандидатов, генерация вопросов)
│       ├── schemas.py      # Pydantic модели данных
│       └── storage.py      # In-memory хранилище
├── frontend/               # React + Vite frontend
│   └── src/
│       ├── App.jsx         # Root component
│       ├── api/client.js   # API client
│       ├── data/constants.js
│       ├── pages/
│       │   └── RecruitmentFlow.jsx  # Основной page с workflow
│       └── components/layout/
│           ├── Sidebar.jsx
│           └── Topbar.jsx
├── docs/                   # AsciiDoc документация
│   ├── arch/              # Архитектурная документация
│   └── usecase/           # Use case описания
├── infra/                  # Infrastructure configs
│   └── nginx/
├── samples/                # Sample data (резюме, вакансии)
├── docker-compose.yml      # Docker orchestration
└── README.md
```

## Business модули

1. **Dashboard** — сводная статистика по вакансиям, кандидатам, откликам
2. **Vacancies** — управление вакансиями (создание, закрытие)
3. **Candidates** — управление кандидатами (добавление, хранение)
4. **Applications** — pipeline откликов (new → screening → interview → offer → hired/rejected)
5. **AI Candidate Analysis** — анализ соответствия кандидата вакансии
6. **AI Interview Assistant** — генерация вопросов для интервью
7. **Analytics** — аналитика совпадений
8. **Demo Data Generator** — seed данных для демо

## Technology stack

### Backend
- **Framework**: FastAPI 0.115.6
- **Runtime**: Python 3.12
- **Validation**: Pydantic 2.10
- **Server**: Uvicorn 0.34
- **Storage**: In-memory dictionaries (MVP)

### Frontend
- **Framework**: React 18
- **Build**: Vite
- **State**: Zustand (планируется)
- **Data fetching**: React Query (планируется)
- **Icons**: Lucide React

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx 1.27
- **Object Storage**: MinIO (для резюме/файлов)

## API Endpoints

### Authentication
- `POST /api/auth/login` — mock login (дефолтный логин: `depopova`)

### Vacancies
- `POST /api/vacancies` — создать вакансию
- `GET /api/vacancies` — список вакансий
- `PATCH /api/vacancies/{id}/close` — закрыть вакансию

### Candidates
- `POST /api/candidates` — создать кандидата
- `GET /api/candidates` — список кандидатов

### Applications
- `POST /api/applications` — создать отклик
- `GET /api/applications` — список откликов
- `POST /api/applications/{id}/analyze` — AI-анализ отклика
- `PATCH /api/applications/{id}/stage` — обновить stage pipeline
- `GET /api/applications/{id}/interview-questions` — получить AI-вопросы

### Dashboard
- `GET /api/dashboard` — сводная статистика

### Demo
- `POST /api/demo-seed` — создать demo данные

### Legacy endpoints
- `/api/v1/candidates/*` — совместимость со старым API

## Data Models

### Vacancy
```python
{
    id: int
    title: str
    department: str
    description: str
    required_skills: List[str]
    salary_from/to: Optional[int]
    status: "open" | "closed"
}
```

### Candidate
```python
{
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str]
    skills: List[str]
    experience_years: int
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

### AiAnalysis
```python
{
    score: int  # 0-100
    matched_skills: List[str]
    missing_skills: List[str]
    summary: str
    recommendation: str
}
```

## AI Logic

### Анализ кандидата (`ai_service.py`)
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

## Development

### Запуск через Docker
```bash
docker-compose up
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- MinIO Console: http://localhost:9001
- Nginx: http://localhost:80

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

### Login для демо
- Логин: `depopova`
- Пароль: не требуется (mock)

## Architecture

Текущая реализация — монолит с in-memory хранилищем.

Документация архитектуры (docs/arch/):
- `architecture.adoc` — схема сервисов (планируемая микросервисная архитектура)
- `dataflow.adoc` — движение данных
- `hr_api_service.adoc` — структура API

Планируемые сервисы:
- hr-api-service
- hr-etl-service
- hr-job-service
- hr-matching-service
- hr-analytics-service
- hr-ontology-service

## Testing

Запуск демо-сценария:
1. Создать вакансию
2. Добавить кандидата
3. Создать отклик (связать кандидата с вакансией)
4. Выполнить AI-анализ
5. Пройти по pipeline stages
6. Получить вопросы для интервью

Или использовать `POST /api/demo-seed` для быстрого старта с demo данными.

## Files of interest

- `backend/app/main.py` — все API endpoints
- `backend/app/ai_service.py` — AI-логика
- `backend/app/schemas.py` — все data models
- `frontend/src/pages/RecruitmentFlow.jsx` — основной UI workflow
- `frontend/src/api/client.js` — API client методы

## Build roadmap (из README)

1. Project bootstrap
2. Application layout
3. Dashboard
4. Vacancy management
5. Candidate management
6. Application pipeline
7. AI candidate analysis
8. Interview assistant
9. Analytics
10. Demo scenario
