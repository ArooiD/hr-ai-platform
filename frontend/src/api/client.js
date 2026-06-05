const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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

export const hrApi = {
  dashboard: () => apiRequest('/api/dashboard'),
  vacancies: () => apiRequest('/api/vacancies'),
  candidates: () => apiRequest('/api/candidates'),
  applications: () => apiRequest('/api/applications'),
  seedDemo: () => apiRequest('/api/demo-seed', { method: 'POST' }),
  analyzeApplication: (id) => apiRequest(`/api/applications/${id}/analyze`, { method: 'POST' }),
  updateApplicationStage: (id, stage) => apiRequest(`/api/applications/${id}/stage`, {
    method: 'PATCH',
    body: JSON.stringify({ stage }),
  }),
};
