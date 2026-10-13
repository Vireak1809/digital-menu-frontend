import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types';
import { setAccessToken } from '../api/client';
import { disconnectSocket } from '../api/socket';

interface AuthState {
  user: AuthUser | null;
  setSession: (user: AuthUser, accessToken: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setSession: (user, accessToken) => {
        setAccessToken(accessToken);
        set({ user });
      },
      clear: () => {
        setAccessToken(null);
        disconnectSocket();
        set({ user: null });
      },
    }),
    {
      name: 'dm_auth',
      partialize: (s) => ({ user: s.user }),
    },
  ),
);