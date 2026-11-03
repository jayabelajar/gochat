import { create } from 'zustand';
import { User, PresenceStatus } from '@/types';
import { apiRequest } from '@/lib/api';
import { socketClient } from '@/lib/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setUserStatus: (status: PresenceStatus) => Promise<void>;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('gochat_token') : null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('gochat_token', token);
    }
    set({ user, token, isAuthenticated: true, isLoading: false });
    socketClient.connect(token);
  },

  setUserStatus: async (status: PresenceStatus) => {
    try {
      const updated = await apiRequest<User>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      set({ user: updated });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  },

  checkAuth: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('gochat_token') : null;
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const user = await apiRequest<User>('/auth/me');
      set({ user, token, isAuthenticated: true, isLoading: false });
      socketClient.connect(token);
    } catch (err) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gochat_token');
      }
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      const token = get().token;
      if (token) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: token }),
        }).catch(() => {});
      }
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gochat_token');
      }
      socketClient.disconnect();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

