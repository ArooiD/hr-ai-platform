"""Service for extracting text from documents"""
from typing import Optional
from pathlib import BytesIO

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

try:
    import docx
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False


class TextExtractionService:
    """Service for extracting text from various document formats"""
    
    @staticmethod
    def extract_text(file_bytes: bytes, filename: str) -> Optional[str]:
        """Extract text from document file (PDF, DOCX, TXT)"""
        ext = Path(filename).suffix.lower() if (Path := __import__('pathlib').Path) else filename.split('.')[-1].lower()
        
        try:
            if ext == '.pdf':
                return TextExtractionService._extract_from_pdf(file_bytes)
            elif ext in ['.docx', '.doc']:
                return TextExtractionService._extract_from_docx(file_bytes)
            elif ext == '.txt':
                return file_bytes.decode('utf-8', errors='ignore')
            else:
                try:
                    return file_bytes.decode('utf-8', errors='ignore')
                except:
                    return None
        except Exception as e:
            print(f"❌ Error extracting text from {filename}: {e}")
            return None
    
    @staticmethod
    def _extract_from_pdf(file_bytes: bytes) -> Optional[str]:
        """Extract text from PDF file"""
        if not PDFPLUMBER_AVAILABLE:
            return None
        
        try:
            text = []
            with pdfplumber.open(BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text.append(page_text)
            return '\n\n'.join(text)
        except Exception as e:
            print(f"❌ Error extracting PDF text: {e}")
            return None
    
    @staticmethod
    def _extract_from_docx(file_bytes: bytes) -> Optional[str]:
        """Extract text from DOCX file"""
        if not DOCX_AVAILABLE:
            return None
        
        try:
            doc = docx.Document(BytesIO(file_bytes))
            text = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            return '\n\n'.join(text)
        except Exception as e:
            print(f"❌ Error extracting DOCX text: {e}")
            return None


text_extraction_service = TextExtractionService()
