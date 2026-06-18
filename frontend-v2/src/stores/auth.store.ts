import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import * as http from '@/lib/http';
import type { AxiosError } from 'axios';

// ===== Types =====

export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  bio?: string | null;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

// ===== State & Actions =====

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

// ===== Helpers =====

const getAuthError = (error: unknown): string => {
  if (error instanceof Error) {
    const axiosError = error as AxiosError<{ message?: string | string[] }>;
    const message = axiosError.response?.data?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    if (axiosError.code === 'ECONNABORTED')
      return 'Request timeout. Check if backend is running.';
    if (!axiosError.response)
      return 'Cannot connect to backend at localhost:3000.';
  }
  return 'Authentication failed. Please try again.';
};

const persistSession = (session: AuthSession) => {
  http.saveTokens(session.accessToken, session.refreshToken);
  return session;
};

// ===== Store =====

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        // State
        user: null,
        isLoading: false,
        error: null,

        // Actions
        login: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const session = persistSession(
              await http.post<AuthSession>('/auth/login', { email, password }),
            );
            set({ user: session.user, isLoading: false });
          } catch (error) {
            const message = getAuthError(error);
            set({ isLoading: false, error: message });
            throw new Error(message);
          }
        },

        loginWithGoogle: async (idToken) => {
          set({ isLoading: true, error: null });
          try {
            const session = persistSession(
              await http.post<AuthSession>('/auth/google', { idToken }),
            );
            set({ user: session.user, isLoading: false });
          } catch (error) {
            const message = getAuthError(error);
            set({ isLoading: false, error: message });
            throw new Error(message);
          }
        },

        register: async (payload) => {
          set({ isLoading: true, error: null });
          try {
            const session = persistSession(
              await http.post<AuthSession>('/auth/register', payload),
            );
            set({ user: session.user, isLoading: false });
          } catch (error) {
            const message = getAuthError(error);
            set({ isLoading: false, error: message });
            throw new Error(message);
          }
        },

        logout: async () => {
          const refreshToken = http.getRefreshToken();
          try {
            if (refreshToken) {
              await http.post('/auth/logout', { refreshToken });
            }
          } catch {
            // Ignore logout API errors
          } finally {
            http.clearTokens();
            set({ user: null, error: null });
          }
        },

        setUser: (user) => set({ user }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'tiktok-auth',
        partialize: (state) => ({ user: state.user }),
      },
    ),
  ),
);
