import { create } from 'zustand';
import testCaseService from '../services/testCaseService';

const useTestCaseStore = create((set) => ({
  testCases: [],
  generatedTestCases: [],
  loading: false,
  generating: false,
  error: null,
  pagination: { total: 0, page: 1, pages: 1 },
  projectContext: null,
  lastTestCaseId: null,
  contextLoaded: false,

  generateTestCases: async (data) => {
    set({ generating: true, error: null, generatedTestCases: [] });
    try {
      const result = await testCaseService.generateTestCases(data);
      set({ generatedTestCases: result.testCases, generating: false });
      return result;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to generate test cases';
      set({ error: message, generating: false });
      throw new Error(message);
    }
  },

  updateGeneratedTestCase: (index, data) => {
    set((state) => {
      const updated = [...state.generatedTestCases];
      updated[index] = { ...updated[index], ...data };
      return { generatedTestCases: updated };
    });
  },

  removeGeneratedTestCase: (index) => {
    set((state) => ({
      generatedTestCases: state.generatedTestCases.filter((_, i) => i !== index),
    }));
  },

  clearGeneratedTestCases: () => set({ generatedTestCases: [], error: null }),

  saveTestCases: async (projectId, testCases) => {
    set({ loading: true, error: null });
    try {
      const result = await testCaseService.saveTestCases({
        projectId,
        testCases: testCases.map((tc) => ({
          data: tc,
          status: 'draft',
          generatedBy: 'ai',
        })),
      });
      set((state) => ({
        testCases: [...result.testCases, ...state.testCases],
        generatedTestCases: [],
        loading: false,
      }));
      return result;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save test cases';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  fetchTestCases: async (projectId, params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await testCaseService.getTestCases(projectId, params);
      set({
        testCases: data.testCases,
        pagination: data.pagination,
        loading: false,
      });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch test cases';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  updateTestCase: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await testCaseService.updateTestCase(id, data);
      set((state) => ({
        testCases: state.testCases.map((tc) => (tc._id === id ? updated : tc)),
        loading: false,
      }));
      return updated;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update test case';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  deleteTestCase: async (id) => {
    set({ loading: true, error: null });
    try {
      await testCaseService.deleteTestCase(id);
      set((state) => ({
        testCases: state.testCases.filter((tc) => tc._id !== id),
        loading: false,
      }));
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete test case';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  duplicateTestCase: async (id) => {
    set({ loading: true, error: null });
    try {
      const duplicated = await testCaseService.duplicateTestCase(id);
      set((state) => ({
        testCases: [duplicated, ...state.testCases],
        loading: false,
      }));
      return duplicated;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to duplicate test case';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  bulkDeleteTestCases: async (ids) => {
    set({ loading: true, error: null });
    try {
      await testCaseService.bulkDeleteTestCases(ids);
      set((state) => ({
        testCases: state.testCases.filter((tc) => !ids.includes(tc._id)),
        loading: false,
      }));
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete test cases';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  bulkUpdateStatus: async (ids, status) => {
    set({ loading: true, error: null });
    try {
      await testCaseService.bulkUpdateStatus(ids, status);
      set((state) => ({
        testCases: state.testCases.map((tc) =>
          ids.includes(tc._id) ? { ...tc, status } : tc
        ),
        loading: false,
      }));
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update status';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  fetchProjectContext: async (projectId) => {
    try {
      const data = await testCaseService.getProjectContext(projectId);
      set({
        projectContext: data.context,
        lastTestCaseId: data.lastTestCaseId,
        contextLoaded: true,
      });
      return data;
    } catch (error) {
      set({ contextLoaded: true });
      return null;
    }
  },

  clearProjectContext: () => set({ projectContext: null, lastTestCaseId: null, contextLoaded: false }),

  clearError: () => set({ error: null }),
}));

export default useTestCaseStore;
