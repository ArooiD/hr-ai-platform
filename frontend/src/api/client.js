const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // Keep default message when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json();
}

# API для аутентификации
export const authApi = {
  # Вход в систему с логином и паролем
    login: (payload) => apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

# API для работы с вакансиями, кандидатами, откликами
export const hrApi = {
  dashboard: () => apiRequest('/api/dashboard'),
  vacancies: () => apiRequest('/api/vacancies'),
  candidates: () => apiRequest('/api/candidates'),
  applications: () => apiRequest('/api/applications'),
  seedDemo: () => apiRequest('/api/demo-seed', { method: 'POST' }),
  createVacancy: (payload) => apiRequest('/api/vacancies', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateVacancy: (id, payload) => apiRequest(`/api/vacancies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteVacancy: (id) => apiRequest(`/api/vacancies/${id}`, {
    method: 'DELETE',
  }),
  createCandidate: (payload) => apiRequest('/api/candidates', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  updateCandidate: (id, payload) => apiRequest(`/api/candidates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  deleteCandidate: (id) => apiRequest(`/api/candidates/${id}`, {
    method: 'DELETE',
  }),
  createApplication: (payload) => apiRequest('/api/applications', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  analyzeApplication: (id) => apiRequest(`/api/applications/${id}/analyze`, { method: 'POST' }),
  interviewQuestions: (id) => apiRequest(`/api/applications/${id}/interview-questions`),
  updateApplicationStage: (id, stage) => apiRequest(`/api/applications/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage }),
  }),
};

export const dashboardApi = {
  getDashboard: () => apiRequest('/api/dashboard'),
};
