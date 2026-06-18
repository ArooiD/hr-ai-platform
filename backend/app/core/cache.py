"""In-memory cache with TTL support"""
import time
import hashlib
import json
from typing import Any, Optional, Callable
from functools import wraps
import threading


class CacheEntry:
    """Кэш запись с TTL"""
    def __init__(self, value: Any, ttl: int):
        self.value = value
        self.expires_at = time.time() + ttl
        self.created_at = time.time()
        self.hits = 0
    
    def is_expired(self) -> bool:
        return time.time() > self.expires_at


class SimpleCache:
    """Простой in-memory кэш с TTL"""
    
    def __init__(self, default_ttl: int = 300):
        """
        Args:
            default_ttl: Время жизни кэша по умолчанию в секундах (5 минут)
        """
        self._cache: dict[str, CacheEntry] = {}
        self._default_ttl = default_ttl
        self._lock = threading.RLock()
        self._stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Получить значение из кэша"""
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                self._stats['misses'] += 1
                return None
            
            if entry.is_expired():
                self._cache.pop(key, None)
                self._stats['evictions'] += 1
                self._stats['misses'] += 1
                return None
            
            entry.hits += 1
            self._stats['hits'] += 1
            return entry.value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Сохранить значение в кэш"""
        with self._lock:
            ttl = ttl or self._default_ttl
            self._cache[key] = CacheEntry(value, ttl)
    
    def delete(self, key: str) -> bool:
        """Удалить значение из кэша"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False
    
    def clear(self) -> None:
        """Очистить весь кэш"""
        with self._lock:
            self._cache.clear()
            self._stats['evictions'] += len(self._cache)
    
    def get_stats(self) -> dict:
        """Получить статистику кэша"""
        with self._lock:
            total = self._stats['hits'] + self._stats['misses']
            hit_rate = (self._stats['hits'] / total * 100) if total > 0 else 0
            return {
                **self._stats,
                'hit_rate': round(hit_rate, 2),
                'size': len(self._cache)
            }
    
    def cleanup_expired(self) -> int:
        """Удалить просроченные записи"""
        with self._lock:
            expired_keys = [
                key for key, entry in self._cache.items()
                if entry.is_expired()
            ]
            for key in expired_keys:
                del self._cache[key]
            self._stats['evictions'] += len(expired_keys)
            return len(expired_keys)


# Глобальный экземпляр кэша
cache = SimpleCache(default_ttl=300)  # 5 минут по умолчанию


def cached(ttl: Optional[int] = None, key_prefix: str = ''):
    """
    Декоратор для кэширования результатов функций
    
    Args:
        ttl: Время жизни кэша в секундах
        key_prefix: Префикс для ключей кэша
    
    Example:
        @cached(ttl=60, key_prefix='vacancies')
        def get_vacancies_list(db):
            return db.query(Vacancy).all()
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Создаём уникальный ключ из аргументов
            key_data = {
                'func': func.__name__,
                'args': str(args),
                'kwargs': str(sorted(kwargs.items()))
            }
            key_hash = hashlib.md5(
                json.dumps(key_data, sort_keys=True).encode()
            ).hexdigest()
            key = f"{key_prefix}:{func.__name__}:{key_hash}"
            
            # Пробуем получить из кэша
            cached_result = cache.get(key)
            if cached_result is not None:
                return cached_result
            
            # Выполняем функцию
            result = func(*args, **kwargs)
            
            # Сохраняем в кэш
            cache.set(key, result, ttl)
            return result
        
        return wrapper
    return decorator


def cache_invalidate(pattern: str = ''):
    """
    Декоратор для инвалидации кэша после изменения данных
    
    Args:
        pattern: Паттерн ключей для инвалидации (поддерживает * как wildcard)
    
    Example:
        @cache_invalidate(pattern='vacancies:*')
        def create_vacancy(db, data):
            ...
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Выполняем функцию
            result = func(*args, **kwargs)
            
            # Инвалидируем кэш
            if pattern:
                cache.delete_by_pattern(pattern)
            
            return result
        
        return wrapper
    return decorator


# Добавляем метод для удаления по паттерну
def delete_by_pattern(self, pattern: str) -> int:
    """Удалить ключи по паттерну (поддерживает * как wildcard)"""
    import fnmatch
    with self._lock:
        keys_to_delete = [
            key for key in self._cache.keys()
            if fnmatch.fnmatch(key, pattern)
        ]
        for key in keys_to_delete:
            del self._cache[key]
        self._stats['evictions'] += len(keys_to_delete)
        return len(keys_to_delete)


SimpleCache.delete_by_pattern = delete_by_pattern
