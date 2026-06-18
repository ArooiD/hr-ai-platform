# HR AI Platform — Styles Guide

## Структура стилей

Проект использует модульную структуру CSS файлов для удобства поддержки и редактирования.

### 📁 Структура директории

```
frontend/src/styles/
├── index.css              # Главный файл-точка входа (импортирует все модули)
├── variables.css          # CSS переменные и глобальные стили
├── layout.css             # Макет: sidebar, topbar, breadcrumbs, навигация
├── components.css         # Общие компоненты: кнопки, карточки, формы, модальные окна
├── responsive.css         # Media queries для адаптивности
└── pages/
    ├── login.css          # Страница входа
    ├── dashboard.css      # Dashboard страница
    ├── flow.css           # Recruitment Flow страница
    └── candidates.css     # Кандидаты (специфичные стили)
```

### 📋 Описание модулей

#### `index.css`
Главный файл, который импортирует все модули в правильном порядке. Импортируется в `App.jsx`.

#### `variables.css`
- CSS custom properties (переменные)
- Глобальные reset стили
- Базовые стили для body, button, input

**Переменные:**
```css
--blue: #0b73ff
--blue-dark: #005ee0
--green: #34c759
--violet: #a855f7
--orange: #ff9f0a
--text: #22242a
--muted: #9aa0a8
--line: #edf0f4
--bg: #f7f9fc
--panel: #ffffff
--soft-blue: #eaf4ff
--shadow: 0 18px 45px rgba(23, 43, 54, 0.08)
```

#### `layout.css`
Стили для общей структуры приложения:
- `.app-shell` — основной контейнер
- `.sidebar` — боковая панель (включая collapsed state)
- `.topbar` — верхняя панель
- `.breadcrumbs` — навигационные крошки
- `.workspace` — рабочая область
- `.nav-item` — элементы навигации
- `.profile` — профиль пользователя в sidebar

#### `components.css`
Общие UI компоненты, используемые на всех страницах:

**Кнопки:**
- `.primary-button` — основная кнопка
- `.secondary-button` — вторичная кнопка
- `.icon-button` — кнопка с иконкой

**Карточки:**
- `.card` — базовая карточка
- `.card-header`, `.card-body`, `.card-actions`
- `.card-grid`, `.cards-grid`, `.candidates-grid`

**Формы:**
- `.form-group` — группа формы
- `.form-row` — строка с двумя колонками
- `.form-actions` — действия формы
- `.search-bar`, `.filters-bar`

**Другие компоненты:**
- `.status-badge` — бейдж статуса
- `.skill-tag` — тег навыка
- `.skills` — контейнер навыков
- `.modal-overlay`, `.modal-content`
- `.loading-state`, `.empty-state`

**Специфичные для кандидатов:**
- `.candidate-card`
- `.candidate-avatar`
- `.contact-info`
- `.candidate-meta`
- `.resume-preview`

#### `responsive.css`
Media queries для адаптивности:

- **`@media (max-width: 1300px)`** — Tablet layout
  - Уменьшенный sidebar
  - 2 колонки для dashboard stats
  
- **`@media (max-width: 900px)`** — Mobile layout
  - Fixed sidebar с transform
  - Single column для всех гридов
  - Вертикальная page-header
  
- **`@media (max-width: 640px)`** — Small mobile
  - Упрощённый login page
  - Full-width модальные окна

#### `pages/login.css`
Стили страницы входа:
- `.login-page` — основной контейнер с градиентом
- `.login-hero` — левая часть с визуализацией
- `.login-card` — карточка входа справа
- `.login-form` — форма входа
- Декоративные элементы: `.art-card`, `.art-document`

#### `pages/dashboard.css`
Стили dashboard страницы:
- `.dashboard-stats` — сетка статистики (4 колонки)
- `.stat-card` — карточка статистики
- `.dashboard-charts` — сетка графиков
- `.chart-card` — карточка графика
- `.recent-activity` — список недавних событий

#### `pages/flow.css`
Стили страницы Recruitment Flow:
- `.flow-header` — заголовок страницы
- `.flow-steps` — сетка шагов (2 колонки)
- `.flow-card` — карточка этапа
- `.flow-form` — форма в этапе
- `.flow-linker` — линкер кандидата и вакансии
- `.flow-applications` — список откликов
- `.flow-ai` — AI анализ
- `.question-list` — список вопросов интервью

#### `pages/candidates.css`
Специфичные стили для страницы кандидатов:
- `.candidate-detail-section` — секция деталей
- `.candidate-resume` — предпросмотр резюме
- `.application-pipeline` — pipeline откликов
- `.pipeline-stage` — этап pipeline

## 🎨 Практики использования

### Добавление новых стилей

1. **Глобальные компоненты** (кнопки, карточки, формы) → `components.css`
2. **Layout элементы** (sidebar, header) → `layout.css`
3. **Стили конкретной страницы** → `pages/<page-name>.css`
4. **CSS переменные** → `variables.css`
5. **Адаптивность** → `responsive.css`

### Переопределение стилей

Используйте CSS переменные вместо хардкод цветов:
```css
/* ✅ Правильно */
background: var(--blue);
color: var(--muted);

/* ❌ Неправильно */
background: #0b73ff;
color: #9aa0a8;
```

### Адаптивные стили

Все media queries находятся в `responsive.css`. Не добавляйте `@media` в другие файлы.

### Классы BEM-like

Проект использует упрощённый BEM:
```css
.block { }
.block__element { }
.block--modifier { }
```

Примеры:
- `.card` — блок
- `.card-header`, `.card-body` — элементы
- `.status-badge.open`, `.status-badge.closed` — модификаторы

## 📦 Старый файл

Файл `frontend/src/styles.css` больше не используется и может быть удалён после подтверждения, что всё работает корректно.
