# Real-time Уведомления через Server-Sent Events (SSE)

## Обзор

Реализована современная система real-time уведомлений с использованием **Server-Sent Events (SSE)** — технологии для одностороннего потока данных от сервера к клиенту.

### Почему SSE вместо WebSocket?

| Критерий | SSE | WebSocket |
|----------|-----|-----------|
| **Сложность** | Простая (HTTP) | Сложная (двусторонний протокол) |
| **Переподключение** | Автоматическое | Ручное управление |
| **HTTP/2** | ✅ Поддержка | ✅ Поддержка |
| **Прокси/Load Balancer** | ✅ Работает | ⚠️ Требует настройки |
| **Использование** | Уведомления, обновления | Чат, игры, collaboration |
| **Оверхед** | Минимальный | Средний |

## Фичи

### Backend (FastAPI)

✅ **Multi-priority streaming**
- HIGH: Критичные уведомления (новые отклики)
- NORMAL: Обычные уведомления
- LOW: Фоновые обновления (heartbeat)

✅ **Session Resumption**
- Восстановление сессии по `last_event_id`
- Пропуск уже доставленных событий

✅ **Queue Management**
- Разные лимиты для каждого приоритета
- Drop policy для переполненных очередей
- HIGH приоритет никогда не теряется

✅ **Heartbeat Monitoring**
- Автоматический heartbeat каждые 15 секунд
- Timeout detection и переподключение

✅ **Statistics & Monitoring**
- Подсчет активных подключений
- Статистика сообщений
- API `/api/sse/stats` для мониторинга

### Frontend (React)

✅ **AdvancedSSEClient**
- Автоматическое переподключение с exponential backoff
- Session resumption по lastEventId
- Event filtering по типу
- Priority-based обработка
- Statistics tracking

✅ **React Hooks**
- `useSSENotifications()` — полный хук для уведомлений
- `useSSEEvents()` — универсальный хук для любых событий
- `useSSEStatus()` — статус подключения

✅ **Auto-reconnect Strategy**
```javascript
1 сек → 1.5 сек → 2.25 сек → 3.37 сек → ... → макс 30 сек
```

## API Reference

### Подключение к SSE

```
GET /api/sse/notifications?token=<auth_token>&last_event_id=<optional>
```

**Query Parameters:**
- `token` (required): JWT auth token
- `last_event_id` (optional): ID последнего полученного события для resumability

**Response Headers:**
```
Cache-Control: no-cache, no-store, must-revalidate
Connection: keep-alive
Content-Type: text/event-stream
```

### Формат событий SSE

```
id: notification_new-abc123
retry: 3000
event: notification_new
priority: high
timestamp: 2026-01-15T10:30:00.000000
data: {"id": "notif-123", "type": "application_new", "title": "...", ...}
```

**Поля:**
- `id`: Уникальный ID события (для resumability)
- `retry`: Время переподключения в мс
- `event`: Тип события
- `priority`: `high` | `normal` | `low`
- `timestamp`: Время создания события
- `data`: JSON данные события

### Типы событий

| Тип события | Приоритет | Описание |
|-------------|-----------|----------|
| `notification_new` | HIGH | Новое уведомление |
| `notification_read` | NORMAL | Уведомление прочитано |
| `notification_read_all` | NORMAL | Все уведомления прочитаны |
| `heartbeat` | LOW | Heartbeat для поддержания соединения |

## Использование

### Backend

#### Отправка уведомления

```python
from app.services.notification.service import notification_service
from app.api.sse import EventPriority

# Установить текущего пользователя
notification_service.set_current_user(user_id="user-123")

# Создать уведомление (автоматически отправится через SSE)
notification = notification_service.create_notification(
    notification_type=NotificationType.APPLICATION_NEW,
    title="Новый отклик",
    message="Кандидат Иван откликнулся на вакансию",
    entity_type="application",
    entity_id=42,
    priority=EventPriority.HIGH  # По умолчанию HIGH
)
```

#### Ручная отправка события

```python
from app.api.sse import send_sse_event, EventPriority

await send_sse_event(
    user_id="user-123",
    event_type="custom_event",
    data={"foo": "bar"},
    priority=EventPriority.NORMAL
)
```

#### Получение статистики

```python
from app.api.sse import sse_manager

count = await sse_manager.get_subscriber_count()
subscribers = sse_manager.get_all_subscribers()
```

### Frontend

#### Инициализация (в App.jsx)

```javascript
import { initSSEClient } from './api/sseNotifications';

function App() {
  const [session, setSession] = useState(...);
  
  useEffect(() => {
    if (session?.token) {
      initSSEClient(session.token);
    }
  }, [session]);
  
  // ...
}
```

#### Использование в компонентах

```javascript
import { useSSENotifications } from './api/sseNotifications';

function NotificationsPanel() {
  const { 
    notifications, 
    unreadCount, 
    isConnected,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useSSENotifications();
  
  useEffect(() => {
    loadNotifications();
  }, []);
  
  return (
    <div>
      <p>{unreadCount} новых уведомлений</p>
      {isConnected && <span className="online-indicator">🟢 Online</span>}
      
      {notifications.map(n => (
        <NotificationItem 
          key={n.id} 
          data={n}
          onRead={() => markAsRead(n.id)}
        />
      ))}
    </div>
  );
}
```

#### Кастомные события

```javascript
import { useSSEEvents } from './api/sseNotifications';

function MyComponent() {
  const { events, isConnected } = useSSEEvents([
    'custom_event_type',
    'another_event'
  ]);
  
  useEffect(() => {
    events.forEach(event => {
      console.log('Received:', event.type, event.data);
    });
  }, [events]);
  
  // ...
}
```

#### Низкоуровневый клиент

```javascript
import AdvancedSSEClient from './api/sse';

const sse = new AdvancedSSEClient('auth-token', {
  baseUrl: '/api/sse/notifications',
  maxReconnectDelay: 30000,
  heartbeatTimeout: 30000,
});

// Подписка на события
sse.on('notification_new', (event) => {
  console.log('Новое уведомление:', event.data);
});

// Подключение
await sse.connect();

// Статистика
console.log(sse.getStats());
// { connected: 1, disconnected: 0, messagesReceived: 10, reconnects: 0 }

// Отключение
sse.disconnect();
```

## Архитектура

```
backend/
├── app/api/sse.py                 # SSE endpoint и менеджер
│   ├── SSESubscribers             # Хранение подключений
│   ├── generate_sse_stream()      # Генератор потока
│   ├── send_sse_event()           # Функция отправки
│   └── EventPriority              # Enum приоритетов
│
└── app/services/notification/
    └── service.py                 # Интеграция с SSE
        └── create_notification()  # Автоматическая отправка

frontend/
├── src/api/sse.js                 # AdvancedSSEClient класс
│   ├── connect()                  # Подключение
│   ├── on() / off()               # Подписчики
│   ├── scheduleReconnect()        # Exponential backoff
│   └── getStats()                 # Статистика
│
├── src/api/sseNotifications.js    # React hooks
│   ├── initSSEClient()            # Глобальная инициализация
│   ├── useSSENotifications()      # Хук для уведомлений
│   ├── useSSEEvents()             # Универсальный хук
│   └── useSSEStatus()             # Статус подключения
│
└── src/components/layout/
    └── TopbarNotifications.jsx    # Интеграция в UI
```

## Мониторинг

### API статистики

```bash
curl http://localhost:8000/api/sse/stats
```

**Ответ:**
```json
{
  "active_connections": 5,
  "subscribers": [
    {
      "user_id": "user-123",
      "connected_at": "2026-01-15T10:30:00.000000",
      "last_event_id": "notification_new-abc123"
    }
  ]
}
```

### Логирование

Backend:
```
[SSE] Connected
[SSE] Disconnected
[SSE] Reconnecting in 1500ms (attempt 2)
```

Frontend (browser console):
```
[SSE] Client not initialized
[SSE] Connected
[SSE] Resuming from event: notification_new-abc123
```

## Тестирование

### Manual тестирование

1. **Открыть несколько вкладок**
   - Откройте приложение в 2-3 вкладках
   - Создайте уведомление в одной вкладке
   - Проверьте, что все вкладки получили событие

2. **Проверить переподключение**
   - Откройте DevTools Network
   - Отключите интернет
   - Подождите 5 секунд
   - Подключите интернет
   - Проверьте автоматическое переподключение

3. **Проверить приоритеты**
   - Создайте HIGH приоритет уведомление
   - Создайте LOW приоритет событие
   - Проверьте порядок получения

### Автоматические тесты

```bash
# Backend
cd backend
pytest tests/integration/test_sse.py

# Frontend
cd frontend
npm run test sse
```

## Производительность

### Ограничения

- **Максимум подключений на пользователя**: 5 (multiple tabs)
- **Queue size**:
  - HIGH: 100 событий
  - NORMAL: 200 событий
  - LOW: 500 событий
- **Drop policy**: LOW приоритет события сбрасываются при переполнении

### Рекомендации

- Используйте HIGH приоритет только для критичных событий
- Batch-обработка для массовых обновлений
- Мониторьте `active_connections` в production

## Troubleshooting

### Уведомления не приходят

1. Проверьте статус подключения:
   ```javascript
   const { isConnected } = useSSEStatus();
   console.log('SSE connected:', isConnected);
   ```

2. Проверьте консоль на ошибки:
   ```
   [SSE] Error: ...
   [SSE] Reconnecting in ...
   ```

3. Проверьте backend логи:
   ```
   [SSE] Connected
   ```

### Много переподключений

Увеличьте `heartbeatTimeout`:
```javascript
initSSEClient(token, {
  heartbeatTimeout: 60000,  // 60 секунд
});
```

### Потеря событий при переподключении

Убедитесь, что передается `last_event_id`:
```javascript
const url = new URL(this.baseUrl, window.location.origin);
if (this.lastEventId) {
  url.searchParams.set('last_event_id', this.lastEventId);
}
```

## Будущие улучшения

- [ ] Compression (gzip/brotli) для больших данных
- [ ] HTTP/2 Server Push
- [ ] Batch events для уменьшения overhead
- [ ] Client-side caching
- [ ] Offline support с IndexedDB
- [ ] Push notifications для мобильных

## Ссылки

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [SSE Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [FastAPI: Streaming Responses](https://fastapi.tiangolo.com/tutorial/response-model/)
