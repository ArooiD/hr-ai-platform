"""Candidate parsing from resume text."""

import re


class CandidateParser:
    """Parser for extracting candidate data from resume text."""
    
    def parse_email(self, text: str) -> str | None:
        """Extract email from text."""
        pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        match = re.search(pattern, text)
        return match.group(0) if match else None
    
    def parse_phone(self, text: str) -> str | None:
        """Extract phone number from text."""
        patterns = [
            r'\+?\d[\d\s-]{8,}\d',
            r'\d{3}[\s-]\d{3}[\s-]\d{2}[\s-]\d{2}',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0).strip()
        return None
    
    def parse_experience_years(self, text: str) -> int | None:
        """Extract years of experience from text."""
        pattern = r'(\d+)\s*[ллет]+'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return None
    
    def extract_name(self, text: str) -> str | None:
        """Extract name from first line of resume."""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        for line in lines:
            if len(line) > 2 and len(line) < 50 and '@' not in line and 'http' not in line:
                return line
        return None
