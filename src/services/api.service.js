/**
 * api.service.js
 * Axios instance with base URL, auth header injection, and token refresh interceptor.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach access token ─────────────────────────────
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('ai_buddy_user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// ── Response interceptor — handle 401 globally ───────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ai_buddy_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Service methods ───────────────────────────────────────────────────────

export const authService = {
  login:   (data)  => api.post('/auth/login', data).then(r => r.data),
  logout:  ()      => api.post('/auth/logout').then(r => r.data),
  refresh: ()      => api.post('/auth/refresh').then(r => r.data),
  me:      ()      => api.get('/auth/me').then(r => r.data),
};

export const studentService = {
  getDashboard:    ()    => api.get('/student/dashboard').then(r => r.data),
  getLearningPath: ()    => api.get('/student/learning-path').then(r => r.data),
  getQuestionBank: (params) => api.get('/student/question-bank', { params }).then(r => r.data),
  startMockTest:   (data)   => api.post('/student/mock-test/start', data).then(r => r.data),
  submitMockTest:  (id, data) => api.post(`/student/mock-test/${id}/submit`, data).then(r => r.data),
  getResults:      (id)  => api.get(`/student/mock-test/${id}/results`).then(r => r.data),
  bookSession:     (data) => api.post('/student/sessions/book', data).then(r => r.data),
  getSessions:     ()    => api.get('/student/sessions').then(r => r.data),
  getEmergency:    ()    => api.get('/student/emergency').then(r => r.data),
};

export const llmService = {
  chat:     (data) => api.post('/llm/chat', data).then(r => r.data),
  summarise:(data) => api.post('/llm/summarise', data).then(r => r.data),
  explain:  (data) => api.post('/llm/explain', data).then(r => r.data),
};

export const forumService = {
  getPosts:   (params) => api.get('/forum', { params }).then(r => r.data),
  createPost: (data)   => api.post('/forum', data).then(r => r.data),
  getPost:    (id)     => api.get(`/forum/${id}`).then(r => r.data),
  reply:      (id, data) => api.post(`/forum/${id}/reply`, data).then(r => r.data),
};

export const hallucinationService = {
  report: (data) => api.post('/hallucination/report', data).then(r => r.data),
};

export default api;
