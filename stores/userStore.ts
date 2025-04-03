import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  userId: string;
  userKeyType: string;
  userKey: string;
  isAdmin: boolean;
  displayName: string;
  photoUrl: string;
  email: string;
  role?: 'publisher' | 'subscriber';
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  setUserRole: (role: 'publisher' | 'subscriber') => void;
  getBasePath: () => string;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      setUserRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, role } : null
        })),
      getBasePath: () => {
        const user = get().user;
        return user?.role === 'publisher' ? '/publisher' : '/subscriber';
      }
    }),
    {
      name: 'user-storage'
    }
  )
);
