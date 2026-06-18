"""Text Service - Утилиты для работы с текстом"""


class TextService:
    """Сервис для работы с текстом"""
    
    @staticmethod
    def clean_string(text: str) -> str:
        """Очистить строку от спецсимволов"""
        if not text:
            return ""
        return text.replace('\x00', '').strip()
    
    @staticmethod
    def truncate(text: str, max_length: int = 200, suffix: str = "...") -> str:
        """Обрезать текст до максимальной длины"""
        if not text or len(text) <= max_length:
            return text
        return text[:max_length - len(suffix)] + suffix


# Глобальный экземпляр для обратной совместимости
text_service = TextService()

# Функция-обёртка
def clean_string(text: str) -> str:
    return TextService.clean_string(text)
