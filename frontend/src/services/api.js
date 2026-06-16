import axios from 'axios';

// Backend port is 5000 by default. Using absolute path for compatibility.
const API_BASE_URL = '/api/components';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getComponents = async () => {
  const response = await api.get('/');
  return response.data;
};

export const createComponent = async (data) => {
  const response = await api.post('/', data);
  return response.data;
};

export const connectComponents = async (data) => {
  const response = await api.post('/connect', data);
  return response.data;
};

export const uploadFile = async (id, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/${id}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getVersionHistory = async (id) => {
  const response = await api.get(`/${id}/history`);
  return response.data;
};

export default {
  getComponents,
  createComponent,
  connectComponents,
  uploadFile,
  getVersionHistory,
};
