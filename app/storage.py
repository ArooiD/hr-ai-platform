vacancies = {}
candidates = {}
applications = {}

_vacancy_id = 1
_candidate_id = 1
_application_id = 1


def next_vacancy_id():
    global _vacancy_id
    value = _vacancy_id
    _vacancy_id += 1
    return value


def next_candidate_id():
    global _candidate_id
    value = _candidate_id
    _candidate_id += 1
    return value


def next_application_id():
    global _application_id
    value = _application_id
    _application_id += 1
    return value
