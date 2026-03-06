import api from './api';

const googleSheetsService = {
  getAuthUrl: async (returnUrl) => {
    const response = await api.get('/google-sheets/auth-url', { params: { returnUrl } });
    return response.data;
  },

  getConnectionStatus: async () => {
    const response = await api.get('/google-sheets/status');
    return response.data;
  },

  createSheet: async (projectId) => {
    const response = await api.post(`/google-sheets/${projectId}/create`);
    return response.data;
  },

  connectSheet: async (projectId, data) => {
    const response = await api.post(`/google-sheets/${projectId}/connect`, data);
    return response.data;
  },

  syncToSheet: async (projectId) => {
    const response = await api.post(`/google-sheets/${projectId}/sync`);
    return response.data;
  },

  disconnectSheet: async (projectId) => {
    const response = await api.post(`/google-sheets/${projectId}/disconnect`);
    return response.data;
  },
};

export default googleSheetsService;
