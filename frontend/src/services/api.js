const API_BASE_URL = '/api';

import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401s (token expiry)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear token and redirect to login if page is active
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // We'll let App.jsx state manage the redirection
    }
    return Promise.reject(error);
  }
);

// Authentication Endpoints
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (name, email, password, role, assignedComponentId) => {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
    role,
    assignedComponentId,
  });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Component & Data Endpoints
export const getComponents = async () => {
  const response = await api.get('/components');
  return response.data;
};

export const createComponent = async (data) => {
  const response = await api.post('/components', data);
  return response.data;
};

export const connectComponents = async (data) => {
  const response = await api.post('/components/connect', data);
  return response.data;
};

export const uploadFile = async (id, file, category, changeDescription) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('changeDescription', changeDescription);

  const response = await api.post(`/components/${id}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getVersionHistory = async (id) => {
  const response = await api.get(`/components/${id}/history`);
  return response.data;
};

// Dependency Endpoints
export const getDependencies = async () => {
  const response = await api.get('/dependencies');
  return response.data;
};

export const createDependency = async (sourceComponentId, dependentComponentId, impactLevel) => {
  const response = await api.post('/dependencies', {
    sourceComponentId,
    dependentComponentId,
    impactLevel
  });
  return response.data;
};

export const deleteDependency = async (id) => {
  const response = await api.delete(`/dependencies/${id}`);
  return response.data;
};

export const getImpactAnalysis = async (componentId) => {
  const response = await api.get(`/dependencies/impact/${componentId}`);
  return response.data;
};

// Notification Endpoints
export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const getUnreadNotificationsCount = async () => {
  const response = await api.get('/notifications/badge');
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export default {
  login,
  register,
  getMe,
  getComponents,
  createComponent,
  connectComponents,
  uploadFile,
  getVersionHistory,
  getDependencies,
  createDependency,
  deleteDependency,
  getImpactAnalysis,
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
};

