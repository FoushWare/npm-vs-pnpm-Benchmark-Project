import { create } from 'zustand';

export const useStore = create((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  user: null,
  setUser: (user) => set({ user })
}));