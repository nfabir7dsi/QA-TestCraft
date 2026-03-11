import api from './api';

const projectService = {
  // Get all projects
  getProjects: async (params = {}) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  // Get single project
  getProject: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Create project (supports file upload via FormData)
  createProject: async (projectData) => {
    const formData = new FormData();
    formData.append('name', projectData.name);
    formData.append('description', projectData.description || '');
    formData.append('websiteUrl', projectData.websiteUrl);
    formData.append('tags', JSON.stringify(projectData.tags || []));
    formData.append('status', projectData.status || 'active');
    if (projectData.documents) {
      projectData.documents.forEach((file) => formData.append('documents', file));
    }
    const response = await api.post('/projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Update project (supports file upload via FormData)
  updateProject: async (id, projectData) => {
    const formData = new FormData();
    if (projectData.name) formData.append('name', projectData.name);
    if (projectData.description !== undefined) formData.append('description', projectData.description);
    if (projectData.websiteUrl) formData.append('websiteUrl', projectData.websiteUrl);
    if (projectData.tags) formData.append('tags', JSON.stringify(projectData.tags));
    if (projectData.status) formData.append('status', projectData.status);
    if (projectData.documents) {
      projectData.documents.forEach((file) => formData.append('documents', file));
    }
    const response = await api.put(`/projects/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Delete a document from a project
  deleteDocument: async (projectId, docIndex) => {
    const response = await api.delete(`/projects/${projectId}/documents/${docIndex}`);
    return response.data;
  },

  // Delete project
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // Get project statistics
  getProjectStats: async () => {
    const response = await api.get('/projects/stats');
    return response.data;
  },
};

export default projectService;
