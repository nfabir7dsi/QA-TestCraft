import api from './api';

const testCaseService = {
  generateTestCases: async (data) => {
    const response = await api.post('/testcases/generate', data);
    return response.data;
  },

  saveTestCases: async (data) => {
    const response = await api.post('/testcases', data);
    return response.data;
  },

  getTestCases: async (projectId, params = {}) => {
    const response = await api.get('/testcases', {
      params: { projectId, ...params },
    });
    return response.data;
  },

  updateTestCase: async (id, data) => {
    const response = await api.put(`/testcases/${id}`, data);
    return response.data;
  },

  deleteTestCase: async (id) => {
    const response = await api.delete(`/testcases/${id}`);
    return response.data;
  },

  duplicateTestCase: async (id) => {
    const response = await api.post(`/testcases/${id}/duplicate`);
    return response.data;
  },

  bulkDeleteTestCases: async (ids) => {
    const response = await api.post('/testcases/bulk-delete', { ids });
    return response.data;
  },

  bulkUpdateStatus: async (ids, status) => {
    const response = await api.post('/testcases/bulk-status', { ids, status });
    return response.data;
  },

  getProjectContext: async (projectId) => {
    const response = await api.get(`/testcases/context/${projectId}`);
    return response.data;
  },
};

export default testCaseService;
