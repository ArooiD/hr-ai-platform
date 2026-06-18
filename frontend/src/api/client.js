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

// API для аутентификации
export const authApi = {
  // Вход в систему с логином и паролем
  login: (payload) => apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

// API для работы с вакансиями, кандидатами, откликами
export const hrApi = {
  dashboard: () => apiRequest('/api/dashboard'),
  vacancies: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const path = `/api/vacancies${queryString ? `?${queryString}` : ''}`;
    return apiRequest(path);
  },
  getVacancy: (id) => apiRequest(`/api/vacancies/${id}`),
  candidates: () => apiRequest('/api/candidates'),
  getCandidate: (id) => apiRequest(`/api/candidates/${id}`),
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
  closeVacancy: (id) => apiRequest(`/api/vacancies/${id}/close`, {
    method: 'PATCH',
  }),
  reopenVacancy: (id) => apiRequest(`/api/vacancies/${id}/reopen`, {
    method: 'PATCH',
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

// API для уведомлений
export const notificationsApi = {
  getNotifications: (limit = 20, unreadOnly = false) => 
    apiRequest(`/api/notifications?limit=${limit}&unread_only=${unreadOnly}`),
  
  getUnreadCount: () => 
    apiRequest('/api/notifications/unread-count'),
  
  markAsRead: (notificationId) => 
    apiRequest(`/api/notifications/${notificationId}/read`, { method: 'POST' }),
  
  markAllAsRead: () => 
    apiRequest('/api/notifications/read-all', { method: 'POST' }),
  
  deleteNotification: (notificationId) => 
    apiRequest(`/api/notifications/${notificationId}`, { method: 'DELETE' }),
};
