"""Documents API - База знаний"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.db_models import DocumentModel
from app.schemas.document import DocumentResponse, DocumentCreate

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("", response_model=DocumentResponse)
def create_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    doc_type: str = Form("guide"),
    department: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    tags: Optional[str] = Form(""),
    access_level: str = Form("public"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """Создать документ"""
    try:
        # Преобразуем doc_type в Enum
        try:
            doc_type_enum = DocumentType(doc_type)
        except ValueError:
            doc_type_enum = DocumentType.guide
        
        # Загружаем файл (заглушка - пока просто сохраняем метаданные)
        file_path = None
        file_name = file.filename if file else None
        file_size = file.size if file else None
        mime_type = file.content_type if file else None
        
        # Создаем документ
        db_doc = DocumentModel(
            title=title,
            description=description,
            doc_type=doc_type_enum,
            department=department,
            role=role,
            tags=tags,
            access_level=access_level,
            file_path=file_path,
            file_name=file_name,
            file_size=file_size,
            mime_type=mime_type,
            status=DocumentStatus.draft
        )
        
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        
        return db_doc
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[DocumentResponse])
def list_documents(
    doc_type: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    """Список документов с фильтрацией"""
    query = db.query(DocumentModel).filter(DocumentModel.is_deleted == False)
    
    if doc_type:
        try:
            query = query.filter(DocumentModel.doc_type == DocumentType(doc_type))
        except ValueError:
            pass
    
    if department:
        query = query.filter(DocumentModel.department == department)
    
    if status:
        try:
            query = query.filter(DocumentModel.status == DocumentStatus(status))
        except ValueError:
            pass
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (DocumentModel.title.ilike(search_term)) | 
            (DocumentModel.description.ilike(search_term)) |
            (DocumentModel.tags.ilike(search_term))
        )
    
    docs = query.offset(offset).limit(limit).all()
    return docs


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    """Получить документ по ID"""
    doc = db.query(DocumentModel).filter(
        DocumentModel.id == doc_id,
        DocumentModel.is_deleted == False
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return doc


@router.post("/{doc_id}/publish")
def publish_document(doc_id: int, db: Session = Depends(get_db)):
    """Опубликовать документ"""
    doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc.status = DocumentStatus.published
    doc.published_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)
    
    return doc


@router.delete("/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    """Удалить документ (мягкое удаление)"""
    doc = db.query(DocumentModel).filter(DocumentModel.id == doc_id).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc.is_deleted = True
    db.commit()
    
    return {"status": "deleted", "id": doc_id}
