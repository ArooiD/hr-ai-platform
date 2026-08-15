"""Document schemas"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


# String literals for document types and status
DocumentType = Literal["policy", "procedure", "role_profile", "template", "guide"]
DocumentStatus = Literal["draft", "published", "archived"]


class DocumentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    doc_type: DocumentType = "guide"
    department: Optional[str] = None
    role: Optional[str] = None
    tags: Optional[str] = ""
    access_level: str = "public"


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    doc_type: Optional[DocumentType] = None
    department: Optional[str] = None
    role: Optional[str] = None
    tags: Optional[str] = None
    access_level: Optional[str] = None
    status: Optional[DocumentStatus] = None


class DocumentResponse(DocumentBase):
    id: int
    status: DocumentStatus
    author_id: Optional[int]
    file_name: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    is_deleted: bool = False

    class Config:
        from_attributes = True
