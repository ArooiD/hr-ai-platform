"""Dashboard Service - Статистика"""


class DashboardService:
    """Сервис дашборда"""
    
    @staticmethod
    def get_stats(db):
        from app.repositories.vacancy_repo import list_vacancies
        from app.repositories.candidate_repository import list_candidates
        from app.repositories.application_repository import list_applications
        
        vacancies = list_vacancies(db)
        candidates = list_candidates(db)
        applications = list_applications(db)
        
        return {
            "total_vacancies": len(vacancies),
            "total_candidates": len(candidates),
            "total_applications": len(applications),
            "open_vacancies": len([v for v in vacancies if v.status.value == "open"]),
        }


dashboard_service = DashboardService()
