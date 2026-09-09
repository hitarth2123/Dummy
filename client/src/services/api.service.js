/**
 * api.service.js
 * Axios instance with base URL, auth header injection, and token refresh interceptor.
 */
import axios from 'axios';
import clientLogger from '@utils/clientLogger';

const api = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api'),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach access token ─────────────────────────────
api.interceptors.request.use((config) => {
  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const startedAt = performance.now();
  config.headers['x-request-id'] = requestId;
  config.metadata = { requestId, startedAt };
  const user = JSON.parse(localStorage.getItem('ai_buddy_user') || 'null');
  if (user?.token || user?.accessToken) {
    config.headers.Authorization = `Bearer ${user.token || user.accessToken}`;
  }
  clientLogger.info('request.started', {
    requestId,
    method: config.method?.toUpperCase(),
    url: `${config.baseURL || ''}${config.url || ''}`,
    data: config.data,
  });
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ── Response interceptor — handle 401 globally with silent token refresh ──
api.interceptors.response.use(
  (res) => {
    const requestId = res.config.metadata?.requestId || res.headers['x-request-id'];
    clientLogger.info('request.completed', {
      requestId,
      method: res.config.method?.toUpperCase(),
      url: res.config.url,
      status: res.status,
      durationMs: res.config.metadata ? Number((performance.now() - res.config.metadata.startedAt).toFixed(2)) : undefined,
      response: {
        type: 'json',
        success: res.data?.success,
        keys: res.data && typeof res.data === 'object' ? Object.keys(res.data) : [],
      },
      output: res.data,
    });
    return res;
  },
  async (err) => {
    const config = err.config || {};
    clientLogger.error('request.failed', {
      requestId: config.metadata?.requestId || err.response?.headers?.['x-request-id'],
      method: config.method?.toUpperCase(),
      url: config.url,
      status: err.response?.status,
      durationMs: config.metadata ? Number((performance.now() - config.metadata.startedAt).toFixed(2)) : undefined,
      message: err.response?.data?.message || err.message,
      output: err.response?.data,
    });

    if (err.response?.status === 401 && !config._retry) {
      const isAuthUrl = config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh');
      if (isAuthUrl) {
        localStorage.removeItem('ai_buddy_user');
        window.location.href = '/login';
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            config.headers.Authorization = `Bearer ${token}`;
            return api(config);
          })
          .catch((refreshErr) => Promise.reject(refreshErr));
      }

      config._retry = true;
      isRefreshing = true;

      const user = JSON.parse(localStorage.getItem('ai_buddy_user') || 'null');
      const refreshToken = user?.refreshToken;

      try {
        const refreshEndpoint = import.meta.env.DEV ? '/api/auth/refresh' : ((import.meta.env.VITE_API_URL || '/api') + '/auth/refresh');
        const { data } = await axios.post(refreshEndpoint, { refreshToken }, { withCredentials: true });
        const resData = data.data || data;
        const newAccessToken = resData?.accessToken;
        const newRefreshToken = resData?.refreshToken;

        if (newAccessToken && user) {
          const updatedUser = {
            ...user,
            token: newAccessToken,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken || user.refreshToken,
          };
          localStorage.setItem('ai_buddy_user', JSON.stringify(updatedUser));
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          config.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return api(config);
        } else {
          throw new Error('Refresh token invalid');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('ai_buddy_user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    if (err.response?.status === 401 && config._retry) {
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
  getSubjects:     ()    => api.get('/student/subjects').then(r => r.data),
  getLearningPath: (params) => api.get('/student/learning-path', { params }).then(r => r.data),
  completeLearningPathTopic: (data) => api.patch('/student/learning-path/topic', data).then(r => r.data),
  getQuestionBank: (params) => api.get('/student/question-bank', { params }).then(r => r.data),
  getQuestionSets: (params) => api.get('/student/question-bank/sets', { params }).then(r => r.data),
  toggleBookmark:  (id)  => api.post(`/student/question-bank/${id}/bookmark`).then(r => r.data),
  getMockTestHistory: () => api.get('/student/mock-tests').then(r => r.data),
  getMockTestResults: (id) => api.get(`/student/mock-test/${id}/results`).then(r => r.data),
  bookSession:     (data) => api.post('/student/sessions/book', data).then(r => r.data),
  getSessions:     ()    => api.get('/student/sessions').then(r => r.data),
  getEmergency:    ()    => api.get('/student/emergency').then(r => r.data),
};

export const mockTestService = {
  generate: (data) => api.post('/llm/mock-test/generate', data).then(r => r.data),
  submit: (id, data) => api.post(`/llm/mock-test/${id}/submit`, data).then(r => r.data),
};

export const learningPathService = {
  generate: (data) => api.post('/llm/learning-path/generate', data).then(r => r.data),
};

export const llmService = {
  chat:     (data) => api.post('/llm/chat', data).then(r => r.data),
  generateMcq: (data) => api.post('/llm/mcq/generate', data).then(r => r.data),
  summarise:(data) => api.post('/llm/summarise', data).then(r => r.data),
  explain:  (data) => api.post('/llm/explain', data).then(r => r.data),
};

export const forumService = {
  getPosts:   (params) => api.get('/forum/posts', { params }).then(r => r.data),
  createPost: (data)   => api.post('/forum/posts', data).then(r => r.data),
  getPost:    (id)     => api.get(`/forum/posts/${id}`).then(r => r.data),
  reply:      (id, data) => api.post(`/forum/posts/${id}/reply`, data).then(r => r.data),
  flagGrievance: (id, data) => api.post(`/forum/posts/${id}/flag-grievance`, data).then(r => r.data),
};

export const feedbackService = {
  submit: (data) => api.post('/forum/feedback', data).then(r => r.data),
  list: (params) => api.get('/admin/feedback', { params }).then(r => r.data),
  export: (params) => api.get('/admin/feedback/export', { params, responseType: 'blob' }).then(r => r.data),
};

export const hallucinationService = {
  report: (data) => api.post('/hallucination/report', data).then(r => r.data),
};

export default api;
