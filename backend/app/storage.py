from app.schemas import Application, Candidate, Vacancy

vacancies: dict[int, Vacancy] = {}
candidates: dict[int, Candidate] = {}
applications: dict[int, Application] = {}

_next_vacancy_id = 1
_next_candidate_id = 1
_next_application_id = 1


def next_vacancy_id() -> int:
    global _next_vacancy_id
    value = _next_vacancy_id
    _next_vacancy_id += 1
    return value


def next_candidate_id() -> int:
    global _next_candidate_id
    value = _next_candidate_id
    _next_candidate_id += 1
    return value


def next_application_id() -> int:
    global _next_application_id
    value = _next_application_id
    _next_application_id += 1
    return value
