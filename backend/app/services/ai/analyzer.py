"""AI Analyzer - Анализ кандидатов и генерация вопросов"""
from typing import Dict, List, Optional


class AIAnalyzer:
    """Сервис для AI анализа кандидатов"""
    
    # Список поддерживаемых навыков
    KNOWN_SKILLS = [
        "Python", "Java", "JavaScript", "TypeScript", "React", "Vue", "Angular",
        "Node.js", "Django", "Flask", "FastAPI", "Spring", "PHP", "C#", "Go",
        "PostgreSQL", "MySQL", "MongoDB", "Redis",
        "Docker", "Kubernetes", "AWS", "Azure", "Git", "Linux",
        "HTML", "CSS", "SASS"
    ]
    
    @staticmethod
    def analyze_candidate(candidate: Dict, vacancy: Dict) -> Dict:
        """
        Проанализировать соответствие кандидата вакансии
        
        Args:
            candidate: Данные кандидата
            vacancy: Данные вакансии
            
        Returns:
            Dict с анализом (score, matched_skills, missing_skills, summary, recommendation)
        """
        # Нормализация навыков
        candidate_skills = [s.lower().strip() for s in candidate.get("skills", [])]
        required_skills = [s.lower().strip() for s in vacancy.get("required_skills", [])]
        
        # Поиск пересечений
        matched_skills = []
        missing_skills = []
        
        for req_skill in required_skills:
            if any(req_skill in cand_skill for cand_skill in candidate_skills):
                matched_skills.append(req_skill)
            else:
                missing_skills.append(req_skill)
        
        # Расчёт score
        if len(required_skills) > 0:
            score = int(len(matched_skills) / len(required_skills) * 100)
        else:
            score = 0
        
        # Генерация summary
        summary = (
            f"Кандидат имеет {len(matched_skills)} из {len(required_skills)} "
            f"необходимых навыков ({score}% совпадение)"
        )
        
        # Генерация рекомендации
        if score >= 80:
            recommendation = "хорошо подходит для позиции"
        elif score >= 50:
            recommendation = "частично подходит для позиции"
        else:
            recommendation = "слабо подходит для позиции"
        
        return {
            "score": score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "summary": summary,
            "recommendation": recommendation
        }
    
    @staticmethod
    def generate_interview_questions(candidate: Dict, vacancy: Dict, max_questions: int = 8) -> Dict:
        """
        Сгенерировать вопросы для интервью
        
        Args:
            candidate: Данные кандидата
            vacancy: Данные вакансии
            max_questions: Максимальное количество вопросов
            
        Returns:
            Dict со списком вопросов
        """
        questions = []
        required_skills = vacancy.get("required_skills", [])
        
        # По 2 вопроса на каждый навык (максимум)
        for skill in required_skills[:max_questions // 2]:
            questions.append(
                f"Расскажите о вашем опыте работы с {skill}. "
                f"Какие проекты вы реализовывали с использованием этой технологии?"
            )
            questions.append(
                f"Какие сложности вы сталкивались при работе с {skill} "
                f"и как их преодолевали?"
            )
            
            if len(questions) >= max_questions - 1:
                break
        
        # Общий вопрос о соответствии
        questions.append(
            f"Почему вы считаете себя подходящим кандидатом на позицию "
            f"'{vacancy.get('title', 'вакансию')}'? "
            f"Какие ваши сильные стороны соответствуют требованиям?"
        )
        
        return {"questions": questions[:max_questions]}


# Глобальный экземпляр
ai_analyzer = AIAnalyzer()


# Для обратной совместимости
def analyze_candidate(candidate: Dict, vacancy: Dict) -> Dict:
    """Функция-обёртка для обратной совместимости"""
    return ai_analyzer.analyze_candidate(candidate, vacancy)


def generate_interview_questions(candidate: Dict, vacancy: Dict, max_questions: int = 8) -> Dict:
    """Функция-обёртка для обратной совместимости"""
    return ai_analyzer.generate_interview_questions(candidate, vacancy, max_questions)
