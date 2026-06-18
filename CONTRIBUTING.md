# Вклад в проект HR AI Platform

## 📋 Содержание

- [Разработка](#разработка)
- [Тестирование](#тестирование)
- [Коммиты](#коммиты)
- [Pull Requests](#pull-requests)
- [Структура проекта](#структура-проекта)

---

## 🛠️ Разработка

### Предварительные требования

- Python 3.12+
- Node.js 18+
- Docker и Docker Compose
- Git

### Настройка окружения

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

**Полный стек через Docker:**
```bash
docker-compose up
```

### Структура кода

#### Backend (MVC архитектура)

```
backend/app/
├── models/          # SQLAlchemy модели
├── schemas/         # Pydantic схемы
├── repositories/    # Data access layer
├── services/        # Business logic
└── api/             # API controllers
```

**Правила:**
- Каждый слой отвечает за свою задачу
- Зависимости только вниз (API → Services → Repositories → Models)
- Использовать type hints
- Документировать сложные функции

#### Frontend

```
frontend/src/
├── components/      # React компоненты
├── pages/           # Страницы
├── api/             # API client
└── __tests__/       # Тесты
```

**Правила:**
- Функциональные компоненты с hooks
- Использование React Router для навигации
- CSS модули или styled-components
- TypeScript предпочтителен

---

## 🧪 Тестирование

### Backend тесты

**Запуск всех тестов:**
```bash
cd backend
pytest
```

**Запуск с coverage:**
```bash
pytest --cov=app --cov-report=html
```

**Запуск конкретных тестов:**
```bash
pytest tests/unit/test_vacancy_service.py -v
```

**Структура тестов:**
```
backend/tests/
├── unit/           # Юнит тесты
│   ├── test_vacancy_service.py
│   ├── test_candidate_service.py
│   └── test_application_service.py
└── integration/    # Интеграционные тесты
    ├── test_api_vacancies.py
    └── test_api_applications.py
```

**Написание тестов:**
```python
import pytest
from app.services.vacancy_service import VacancyService
from app.schemas import VacancyCreate

class TestVacancyService:
    def test_create_vacancy(self, test_db):
        payload = VacancyCreate(
            title="Test",
            department="IT",
            description="Test",
            required_skills=[]
        )
        vacancy = VacancyService.create_vacancy(test_db, payload)
        assert vacancy.title == "Test"
        assert vacancy.status.value == "open"
```

### Frontend тесты

**Запуск всех тестов:**
```bash
cd frontend
npm run test
```

**Запуск с coverage:**
```bash
npm run test:coverage
```

**Запуск в watch режиме:**
```bash
npm run test
```

**Структура тестов:**
```
frontend/src/__tests__/
├── api/
│   └── client.test.js
├── components/
│   └── VacancyWizard.test.jsx
└── pages/
    └── Vacancies.test.jsx
```

**Написание тестов:**
```javascript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Vacancies from '../pages/Vacancies'

describe('Vacancies Page', () => {
  it('должен отображать заголовок', () => {
    render(<Vacancies />)
    expect(screen.getByText(/Вакансии/i)).toBeInTheDocument()
  })
})
```

### Требования к покрытию

- Минимальное покрытие: **70%**
- Критическая логика: **90%+**
- Новые функции: **обязательно покрыты тестами**

---

## 📝 Коммиты

### Формат сообщения

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Типы коммитов

- `feat`: Новая функция
- `fix`: Исправление бага
- `docs`: Документация
- `style`: Форматирование, отсутствие влияния на код
- `refactor`: Рефакторинг
- `test`: Добавление тестов
- `chore`: Изменения для процесса сборки или инструментов

### Примеры

```bash
feat(vacancies): добавить фильтрацию по отделу

Добавлена возможность фильтрации вакансий по отделу
в списке вакансий на frontend.

Closes #123

refactor(architecture): переход на MVC структуру

Перераспределение кода по слоям:
- models/ - SQLAlchemy модели
- schemas/ - Pydantic DTO
- repositories/ - Data access
- services/ - Business logic
- api/ - Controllers

docs(readme): обновить инструкцию по запуску

test(vacancy): добавить юнит тесты для сервиса

Добавлены тесты для:
- create_vacancy
- update_vacancy
- close_vacancy
```

---

## 🔄 Pull Requests

### Процесс

1. Fork репозитория
2. Создайте ветку от `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Сделайте изменения
4. Напишите/обновите тесты
5. Убедитесь, что все тесты проходят
6. Закоммитьте с понятным сообщением
7. Push и создайте PR

### Ветки

- `feature/...` — новые функции
- `bugfix/...` — исправления багов
- `docs/...` — документация
- `refactor/...` — рефакторинг
- `test/...` — тесты

### Требования к PR

- [ ] Все тесты проходят
- [ ] Нет linting ошибок
- [ ] Добавлены тесты для новых функций
- [ ] Обновлена документация (если нужно)
- [ ] Сообщение коммита соответствует стандарту
- [ ] Нет незакоммиченных файлов кроме `node_modules/`, `dist/`

### Описание PR

```markdown
## Описание
Что делает этот PR

## Тип изменений
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] ♻️ Refactor
- [ ] 📝 Documentation
- [ ] ✅ Test

## Как тестировать
Шаги для тестирования изменений

## Screenshots (если применимо)

## Связанные Issues
Closes #123
```

---

## 📚 Код стайл

### Backend (Python)

- **Форматирование**: Black (line length: 100)
- **Linting**: flake8, pylint
- **Type hints**: Обязательно
- **Docstrings**: Google style

```python
def create_vacancy(db: Session, payload: VacancyCreate) -> Vacancy:
    """Создать новую вакансию.
    
    Args:
        db: Database session
        payload: Данные для создания вакансии
        
    Returns:
        Созданная вакансия
        
    Raises:
        HTTPException: Если произошла ошибка
    """
    # Implementation
    pass
```

### Frontend (JavaScript/React)

- **Форматирование**: Prettier
- **Linting**: ESLint
- **Компоненты**: Функциональные с hooks
- **Именование**: PascalCase для компонентов, camelCase для функций

```jsx
/**
 * Компонент списка вакансий
 * @param {Object} props - Props
 * @param {Array} props.vacancies - Список вакансий
 */
const VacanciesList = ({ vacancies }) => {
  // Implementation
  return <div>{/* ... */}</div>
}
```

---

## 🤝 Правила для агентов

### При работе с кодом

1. **Понимать контекст**: Прочитать AGENTS.md и ARCHITECTURE.md
2. **Следовать MVC**: Размещать код в правильном слое
3. **Писать тесты**: Для каждой новой функции писать тесты
4. **Документировать**: Добавлять docstrings и комментарии
5. **Проверять**: Запускать тесты перед завершением задачи

### При создании новых сущностей

1. Создать модель в `models/db_models.py`
2. Создать схемы в `schemas/`
3. Создать репозиторий в `repositories/`
4. Создать сервис в `services/`
5. Создать API контроллер в `api/`
6. Подключить в `api/router.py`
7. Написать юнит тесты
8. Написать интеграционные тесты
9. Обновить документацию

### При исправлении багов

1. Воспроизвести баг
2. Написать тест, который падает
3. Исправить код
4. Убедиться что тест проходит
5. Проверить что другие тесты не сломались

---

## 📞 Вопросы и помощь

Если у вас есть вопросы:
- Прочитайте документацию в `docs/`
- Посмотрите существующие Issues и PR
- Создайте Issue с вопросом

---

## 📄 License

Вкладывая код в этот проект, вы соглашаетесь с лицензией проекта.
