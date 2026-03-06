import { create } from 'zustand';
import googleSheetsService from '../services/googleSheetsService';

const useGoogleSheetsStore = create((set) => ({
  googleConnected: false,
  syncing: false,
  error: null,

  checkConnection: async () => {
    try {
      const data = await googleSheetsService.getConnectionStatus();
      set({ googleConnected: data.connected });
      return data.connected;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to check Google connection';
      set({ error: message });
      return false;
    }
  },

  initiateGoogleAuth: async (returnUrl) => {
    try {
      const data = await googleSheetsService.getAuthUrl(returnUrl);
      window.location.href = data.authUrl;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to start Google authentication';
      set({ error: message });
      throw new Error(message);
    }
  },

  createSheet: async (projectId) => {
    set({ syncing: true, error: null });
    try {
      const result = await googleSheetsService.createSheet(projectId);
      set({ syncing: false });
      return result;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create Google Sheet';
      set({ error: message, syncing: false });
      throw new Error(message);
    }
  },

  connectSheet: async (projectId, data) => {
    set({ syncing: true, error: null });
    try {
      const result = await googleSheetsService.connectSheet(projectId, data);
      set({ syncing: false });
      return result;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to connect Google Sheet';
      set({ error: message, syncing: false });
      throw new Error(message);
    }
  },

  syncToSheet: async (projectId) => {
    set({ syncing: true, error: null });
    try {
      const result = await googleSheetsService.syncToSheet(projectId);
      set({ syncing: false });
      return result;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to sync to Google Sheet';
      set({ error: message, syncing: false });
      throw new Error(message);
    }
  },

  disconnectSheet: async (projectId) => {
    set({ syncing: true, error: null });
    try {
      const result = await googleSheetsService.disconnectSheet(projectId);
      set({ syncing: false });
      return result;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to disconnect Google Sheet';
      set({ error: message, syncing: false });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useGoogleSheetsStore;
