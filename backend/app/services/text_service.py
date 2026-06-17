from typing import Optional


def clean_string(text: Optional[str]) -> str:
    if text is None:
        return ""
    return str(text).replace("\x00", "").replace("\0", "").strip()


def clean_list(items: list[str]) -> list[str]:
    return [clean_string(item) for item in items if clean_string(item)]


def normalize_email(email: Optional[str]) -> str:
    return clean_string(email).lower()


def join_clean_list(items: list[str]) -> str:
    return ",".join(clean_list(items))
