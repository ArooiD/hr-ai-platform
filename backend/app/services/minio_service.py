"""Service for MinIO file operations"""
import os
from io import BytesIO
from typing import Optional
from datetime import datetime
import uuid

try:
    from minio import Minio
    from minio.error import S3Error
    MINIO_AVAILABLE = True
except ImportError:
    MINIO_AVAILABLE = False


class MinioService:
    """Service for uploading and managing files in MinIO"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "hradmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "hradmin123")
        self.bucket = os.getenv("MINIO_BUCKET", "hr-content")
        self.use_ssl = os.getenv("MINIO_USE_SSL", "false").lower() == "true"
        
        if MINIO_AVAILABLE:
            self.client = Minio(
                self.endpoint,
                access_key=self.access_key,
                secret_key=self.secret_key,
                secure=self.use_ssl
            )
            self._ensure_bucket()
        else:
            self.client = None
            print("⚠️ MinIO not available. Install with: pip install minio")
        
        self._initialized = True
    
    def _ensure_bucket(self):
        """Create bucket if it doesn't exist"""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                print(f"✅ Created bucket: {self.bucket}")
        except S3Error as e:
            print(f"❌ Error creating bucket: {e}")
    
    def upload_file(self, file_bytes: bytes, filename: str, content_type: str = "application/octet-stream") -> Optional[str]:
        """Upload file to MinIO. Returns file_path in MinIO."""
        if not self.client:
            return None
        
        try:
            now = datetime.now()
            date_path = now.strftime("%Y/%m/%d")
            unique_filename = f"{uuid.uuid4().hex[:8]}-{filename}"
            object_name = f"documents/{date_path}/{unique_filename}"
            
            self.client.put_object(
                self.bucket,
                object_name,
                BytesIO(file_bytes),
                len(file_bytes),
                content_type=content_type
            )
            
            return object_name
            
        except S3Error as e:
            print(f"❌ Error uploading file to MinIO: {e}")
            return None


minio_service = MinioService()
