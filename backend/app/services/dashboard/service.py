"""Dashboard Service - Статистика"""


class DashboardService:
    """Сервис дашборда"""
    
    @staticmethod
    def get_dashboard(db):
        from app.repositories.vacancy_repo import VacancyRepository
        from app.repositories.candidate_repository import list_candidates
        from app.repositories.application_repository import list_applications
        
        vacancies = VacancyRepository.list(db)
        candidates = list_candidates(db)
        applications = list_applications(db)
        
        # Считаем вакансии по статусам
        open_vacancies = len([v for v in vacancies if v.status.value == "open"])
        closed_vacancies = len([v for v in vacancies if v.status.value == "closed"])
        
        # Считаем отклики по этапам
        applications_by_stage = {
            "new": 0,
            "screening": 0,
            "interview": 0,
            "offer": 0,
            "hired": 0,
            "rejected": 0,
        }
        
        total_ai_score = 0
        ai_score_count = 0
        
        for app in applications:
            stage = app.stage.value if hasattr(app.stage, 'value') else str(app.stage)
            if stage in applications_by_stage:
                applications_by_stage[stage] += 1
            
            # Считаем средний AI score
            if hasattr(app, 'ai_analysis') and app.ai_analysis:
                try:
                    import json
                    analysis = json.loads(app.ai_analysis) if isinstance(app.ai_analysis, str) else app.ai_analysis
                    if isinstance(analysis, dict) and 'score' in analysis:
                        total_ai_score += analysis['score']
                        ai_score_count += 1
                except (json.JSONDecodeError, TypeError, KeyError):
                    pass
        
        avg_ai_score = round(total_ai_score / ai_score_count, 1) if ai_score_count > 0 else 0
        
        return {
            "total_vacancies": len(vacancies),
            "total_candidates": len(candidates),
            "total_applications": len(applications),
            "open_vacancies": open_vacancies,
            "closed_vacancies": closed_vacancies,
            "candidates": len(candidates),
            "applications": len(applications),
            "applications_by_stage": applications_by_stage,
            "avg_ai_score": avg_ai_score,
        }


dashboard_service = DashboardService()
