import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  isDark: boolean;

  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => {
      // Detect system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      return {
        sidebarCollapsed: false,
        theme: 'system',
        isDark: prefersDark,

        toggleSidebar: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

        setTheme: (theme) => {
          const isDark = theme === 'dark' || (theme === 'system' && 
            window.matchMedia('(prefers-color-scheme: dark)').matches);

          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }

          set({ theme, isDark });
        },
      };
    },
    {
      name: 'escriba-ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
