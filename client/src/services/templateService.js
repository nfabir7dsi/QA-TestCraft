import api from './api';

const templateService = {
  // Get default templates library
  getDefaultTemplates: async () => {
    const response = await api.get('/templates/defaults');
    return response.data;
  },

  // Update project template
  updateProjectTemplate: async (projectId, template) => {
    const response = await api.put(`/projects/${projectId}/template`, {
      testCaseTemplate: template,
    });
    return response.data;
  },
};

export default templateService;