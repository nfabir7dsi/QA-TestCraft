import { create } from 'zustand';
import authService from '../services/authService';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  // Register
  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.register(userData);
      set({ user: data, token: data.token, isAuthenticated: true, loading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  // Login
  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.login(credentials);
      set({ user: data, token: data.token, isAuthenticated: true, loading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  // Logout
  logout: () => {
    authService.logout();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  // Update profile
  updateProfile: async (userData) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.updateProfile(userData);
      set({ user: data, token: data.token, loading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
