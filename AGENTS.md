# HR AI Platform — Agent Guidelines

## Проект

MVP HR-платформы со сквозным процессом подбора персонала, wizard-интерфейсом для создания вакансий и кандидатов, AI-парсингом резюме (PDF/DOC/DOCX/TXT) и PostgreSQL базой данных.

## Текущий статус (2026-01)

### ✅ Завершено
- **React Router** — профессиональная навигация вместо hash-based
- **3-этапный Wizard для вакансий** — создание с AI-парсингом описания
- **3-этапный Wizard для кандидатов** — загрузка резюме (PDF/DOC/DOCX/TXT) с AI-извлечением данных
- **Компактные списки** — Vacancies и Candidates с детальными страницами
- **PostgreSQL** — полноценная БД вместо in-memory хранилища
- **AI-парсинг резюме** — поддержка PDF, DOC, DOCX, TXT форматов
- **Умное извлечение данных** — имя, email, телефон, опыт, навыки (25+ технологий)
- **Hash-based роутинг** → React Router миграция завершена
- **Sidebar навигация** — работает с React Router
- **PostgreSQL NUL fix** — очистка спецсимволов перед записью

### 🔄 В работе
- Интеграция с реальным AI API для парсинга (сейчас mock данные)
- Refactoring Candidates и Analytics страниц
- End-to-end тестирование полного цикла

## Структура проекта

```
hr-ai-platform/
├── backend/                 # FastAPI backend + PostgreSQL
│   └── app/
│       ├── main.py         # Основные API endpoints + clean_string helpers
│       ├── core/           # Конфигурация и безопасность
│       │   ├── config.py   # Settings из env
│       │   └── security.py # Auth utilities
│       ├── services/       # Бизнес-логика
│       │   └── auth_service.py
│       ├── schemas.py      # Pydantic модели данных
│       └── storage.py      # PostgreSQL storage
├── frontend/               # React + Vite + React Router
│   └── src/
│       ├── App.jsx         # Root с BrowserRouter
│       ├── api/client.js   # API client (hrApi, authApi)
│       ├── pages/
│       │   ├── Vacancies.jsx           # Компактный список
│       │   ├── VacancyDetail/          # Детальная страница
│       │   ├── Candidates.jsx          # Компактный список
│       │   ├── CandidateDetail/        # Детальная страница с резюме
│       │   ├── RecruitmentFlow.jsx     # Сквозной workflow
│       │   └── Analytics.jsx           # Аналитика
│       ├── components/
│       │   ├── VacancyWizard/          # 3-этапный wizard для вакансий
│       │   ├── CandidateWizard/        # 3-этапный wizard с парсингом резюме
│       │   └── layout/
│       │       ├── Sidebar.jsx         # Навигация с useNavigate
│       │       └── Topbar.jsx
│       └── styles.css
├── docs/                   # AsciiDoc документация архитектуры
├── infra/                  # Nginx конфигурация
├── samples/                # Sample data (резюме, вакансии)
├── docker-compose.yml      # Docker orchestration (PostgreSQL, MinIO, Backend, Frontend)
├── AGENTS.md              # Настоящий файл
└── README.md
```

## Business модули

1. **Dashboard** — сводная статистика по вакансиям, кандидатам, откликам
2. **Vacancies** — управление вакансиями (Wizard + список + детали)
3. **Candidates** — управление кандидатами (Wizard с парсингом резюме + список + детали)
4. **Applications** — pipeline откликов (new → screening → interview → offer → hired/rejected)
5. **AI Candidate Analysis** — анализ соответствия кандидата вакансии
6. **AI Interview Assistant** — генерация вопросов для интервью
7. **Analytics** — аналитика совпадений
8. **Demo Data Generator** — seed данных для демо

## Technology stack

### Backend
- **Framework**: FastAPI 0.115.6
- **Runtime**: Python 3.12+
- **Validation**: Pydantic 2.10
- **Server**: Uvicorn 0.34
- **Database**: PostgreSQL 15+ (alembic migrations)
- **Storage**: PostgreSQL + MinIO (для файлов)

### Frontend
- **Framework**: React 18
- **Router**: React Router DOM 7+
- **Build**: Vite 8
- **Icons**: Lucide React
- **HTTP Client**: Axios (через hrApi)
- **File Parsing**: pdf-parse, mammoth (для резюме)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx 1.27
- **Object Storage**: MinIO (для резюме/файлов)
- **Database**: PostgreSQL

## API Endpoints

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

### Dashboard
- `GET /api/dashboard` — сводная статистика

### Demo
- `POST /api/demo-seed` — создать demo данные

## Data Models

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

## Frontend Components

### Wizard Компоненты

**VacancyWizard** (`/components/VacancyWizard/`)
- Этап 1: Ввод описания (чат или файл) + AI-парсинг
- Этап 2: Проверка и редактирование полей
- Этап 3: Успешное создание

**CandidateWizard** (`/components/CandidateWizard/`)
- Этап 1: Загрузка резюме (PDF/DOC/DOCX/TXT) + AI-извлечение
- Этап 2: Проверка и редактирование данных
- Этап 3: Успешное создание

### Страницы

**Vacancies** (`/pages/Vacancies.jsx`)
- Компактный список карточек
- Название, отдел, зарплата, 2-3 навыка
- Клик → детальная страница
- Кнопка "Создать вакансию" → Wizard

**VacancyDetail** (`/pages/VacancyDetail/`)
- Полное описание
- Все навыки
- Информация (отдел, зарплата, статус)
- Действия: Редактировать, Удалить

**Candidates** (`/pages/Candidates.jsx`)
- Компактный список карточек
- Имя, email, опыт, 2-3 навыка
- Клик → детальная страница
- Кнопка "Добавить кандидата" → Wizard

**CandidateDetail** (`/pages/CandidateDetail/`)
- Полное резюме
- Все навыки
- Контакты (имя, email, телефон, опыт)
- Действия: Редактировать, Удалить

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

Текущая реализация — монолит с PostgreSQL базой данных.

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
1. Создать вакансию (Wizard)
2. Добавить кандидата (Wizard с резюме)
3. Создать отклик (связать кандидата с вакансией)
4. Выполнить AI-анализ
5. Пройти по pipeline stages
6. Получить вопросы для интервью

Или использовать `POST /api/demo-seed` для быстрого старта с demo данными.

## Files of interest

### Backend
- `backend/app/main.py` — все API endpoints + clean_string helpers
- `backend/app/core/config.py` — конфигурация
- `backend/app/core/security.py` — auth utilities
- `backend/app/services/auth_service.py` — auth сервис
- `backend/app/schemas.py` — все data models
- `backend/app/storage.py` — PostgreSQL storage

### Frontend
- `frontend/src/App.jsx` — BrowserRouter + Routes
- `frontend/src/pages/Vacancies.jsx` — список вакансий
- `frontend/src/pages/VacancyDetail/index.jsx` — детали вакансии
- `frontend/src/pages/Candidates.jsx` — список кандидатов
- `frontend/src/pages/CandidateDetail/index.jsx` — детали кандидата
- `frontend/src/components/VacancyWizard/index.jsx` — wizard вакансий
- `frontend/src/components/CandidateWizard/index.jsx` — wizard кандидатов с парсингом
- `frontend/src/components/layout/Sidebar.jsx` — навигация
- `frontend/src/api/client.js` — API client методы

## Build roadmap (из README)

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
11. 🔄 Real AI API integration
12. 🔄 Advanced analytics
13. 🔄 Email notifications
