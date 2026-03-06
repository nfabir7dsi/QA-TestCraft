import { create } from 'zustand';
import projectService from '../services/projectService';
import templateService from '../services/templateService';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  stats: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
  },

  // Fetch all projects
  fetchProjects: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await projectService.getProjects(params);
      set({
        projects: data.projects,
        pagination: data.pagination,
        loading: false,
      });
      return data.projects;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch projects';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  // Fetch single project
  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await projectService.getProject(id);
      set({ currentProject: data, loading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch project';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  // Create new project
  createProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      const newProject = await projectService.createProject(projectData);
      set((state) => ({
        projects: [newProject, ...state.projects],
        loading: false,
      }));
      return newProject;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create project';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  // Update project
  updateProject: async (id, projectData) => {
    set({ loading: true, error: null });
    try {
      const updatedProject = await projectService.updateProject(id, projectData);
      set((state) => ({
        projects: state.projects.map((p) =>
          p._id === id ? updatedProject : p
        ),
        currentProject: state.currentProject?._id === id ? updatedProject : state.currentProject,
        loading: false,
      }));
      return updatedProject;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update project';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  // Delete project
  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      await projectService.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        currentProject: state.currentProject?._id === id ? null : state.currentProject,
        loading: false,
      }));
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete project';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  // Update project template
  updateProjectTemplate: async (id, template) => {
    set({ loading: true, error: null });
    try {
      const updatedProject = await templateService.updateProjectTemplate(id, template);
      set((state) => ({
        projects: state.projects.map((p) =>
          p._id === id ? updatedProject : p
        ),
        currentProject: state.currentProject?._id === id ? updatedProject : state.currentProject,
        loading: false,
      }));
      return updatedProject;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update template';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  // Fetch statistics
  fetchStats: async () => {
    try {
      const data = await projectService.getProjectStats();
      set({ stats: data });
      return data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  // Set current project
  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useProjectStore;
