"""RESTful API middleware for caching headers"""
import time
import hashlib
import json
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse


def calculate_etag(data: any) -> str:
    """Calculate ETag hash for response data"""
    if isinstance(data, (dict, list)):
        data_str = json.dumps(data, sort_keys=True, default=str)
    else:
        data_str = str(data)
    
    return f'"{hashlib.md5(data_str.encode()).hexdigest()}"'


async def restful_cache_middleware(request: Request, call_next: Callable) -> Response:
    """
    Middleware для добавления RESTful caching headers
    
    Добавляет:
    - ETag: Уникальный хэш ответа
    - Cache-Control: Инструкции для кэширования
    - Last-Modified: Время последнего изменения
    
    Поддерживает Conditional Requests:
    - If-None-Match: Проверка ETag
    - If-Modified-Since: Проверка времени изменения
    """
    # Проверяем conditional request
    if_none_match = request.headers.get('if-none-match')
    if_modified_since = request.headers.get('if-modified-since')
    
    # Выполняем запрос
    response = await call_next(request)
    
    # Только для GET запросов и успешных ответов
    if request.method != 'GET' or response.status_code != 200:
        return response
    
    # Получаем данные ответа
    if isinstance(response, JSONResponse):
        # Вычисляем ETag
        etag = calculate_etag(response.body)
        
        # Проверяем If-None-Match
        if if_none_match and if_none_match == etag:
            return Response(status_code=304)  # Not Modified
        
        # Добавляем ETag header
        response.headers['ETag'] = etag
        
        # Cache-Control: public, max-age=300 (5 минут)
        # Можно сделать configurable
        response.headers['Cache-Control'] = 'public, max-age=300, must-revalidate'
        
        # Last-Modified: текущее время
        response.headers['Last-Modified'] = time.strftime(
            '%a, %d %b %Y %H:%M:%S GMT', time.gmtime()
        )
        
        # X-Cache: HIT/MISS (будет установлено в response middleware)
        response.headers['X-Cache'] = 'MISS'
    
    return response


async def cache_response_middleware(request: Request, call_next: Callable) -> Response:
    """
    Middleware для работы с кэшем и установки X-Cache header
    """
    # Проверяем, есть ли ответ в кэше
    cache_key = f"api:{request.url.path}"
    
    # Добавляем query params к ключу
    if request.url.query:
        cache_key += f"?{request.url.query}"
    
    from app.core.cache import cache
    
    cached_response = cache.get(cache_key)
    if cached_response:
        # Возвращаем из кэша
        response = JSONResponse(
            content=cached_response['data'],
            status_code=cached_response['status_code'],
            headers=cached_response['headers']
        )
        response.headers['X-Cache'] = 'HIT'
        return response
    
    # Выполняем запрос
    response = await call_next(request)
    
    # Кэшируем успешные GET ответы
    if request.method == 'GET' and response.status_code == 200:
        if isinstance(response, JSONResponse):
            # Сохраняем в кэш
            cache.set(cache_key, {
                'data': response.body,
                'status_code': response.status_code,
                'headers': dict(response.headers)
            }, ttl=300)  # 5 минут
    
    return response
