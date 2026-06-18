"""Application settings"""
import os
from dataclasses import dataclass, field


@dataclass
class Settings:
    """Application settings"""
    database_url: str = field(
        default=os.getenv("DATABASE_URL", "postgresql://hradmin:hradmin123@localhost:5432/hr_platform")
    )
    minio_endpoint: str = field(
        default=os.getenv("MINIO_ENDPOINT", "localhost:9000")
    )
    minio_access_key: str = field(
        default=os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    )
    minio_secret_key: str = field(
        default=os.getenv("MINIO_SECRET_KEY", "minioadmin")
    )
    minio_bucket: str = field(
        default=os.getenv("MINIO_BUCKET", "hr-files")
    )


settings = Settings()
