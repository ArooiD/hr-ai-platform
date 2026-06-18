"""Candidate Parser - Парсинг резюме кандидатов"""
import re
from typing import Dict, List, Optional


class CandidateParser:
    """Парсер для извлечения данных из резюме"""
    
    # Список поддерживаемых навыков
    KNOWN_SKILLS = [
        "Python", "Java", "JavaScript", "TypeScript", "React", "Vue", "Angular",
        "Node.js", "Django", "Flask", "FastAPI", "Spring", "PHP", "C#", "Go",
        "PostgreSQL", "MySQL", "MongoDB", "Redis",
        "Docker", "Kubernetes", "AWS", "Azure", "Git", "Linux",
        "HTML", "CSS", "SASS"
    ]
    
    @staticmethod
    def parse_name(text: str) -> Optional[str]:
        """Извлечь имя из текста"""
        lines = text.strip().split('\n')
        for line in lines:
            line = line.strip()
            if line and len(line) < 50 and '@' not in line and 'http' not in line.lower():
                return line
        return None
    
    @staticmethod
    def parse_email(text: str) -> Optional[str]:
        """Извлечь email из текста"""
        pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        match = re.search(pattern, text)
        return match.group(0) if match else None
    
    @staticmethod
    def parse_phone(text: str) -> Optional[str]:
        """Извлечь телефон из текста"""
        pattern = r'(\+?\d[\d\s-]{8,}\d)'
        match = re.search(pattern, text)
        return match.group(0) if match else None
    
    @staticmethod
    def parse_experience(text: str) -> Optional[int]:
        """Извлечь опыт работы в годах"""
        pattern = r'(\d+)\s*[ллет]+'
        match = re.search(pattern, text.lower())
        return int(match.group(1)) if match else None
    
    @staticmethod
    def parse_skills(text: str) -> List[str]:
        """Извлечь навыки из текста"""
        text_lower = text.lower()
        found_skills = []
        
        for skill in CandidateParser.KNOWN_SKILLS:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        return found_skills
    
    @staticmethod
    def parse_resume(text: str) -> Dict:
        """Полный парсинг резюме"""
        return {
            "full_name": CandidateParser.parse_name(text),
            "email": CandidateParser.parse_email(text),
            "phone": CandidateParser.parse_phone(text),
            "experience_years": CandidateParser.parse_experience(text),
            "skills": CandidateParser.parse_skills(text),
            "resume_text": text
        }
