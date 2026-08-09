import { create } from 'zustand'

type AdminTheme = 'light' | 'dark' | 'system'

interface AdminUiState {
  theme: AdminTheme
  resolvedTheme: 'light' | 'dark'
  sidebarCollapsed: boolean
  setTheme: (theme: AdminTheme) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: AdminTheme): 'light' | 'dark' {
  if (theme === 'system') return getSystemTheme()
  return theme
}

export const useAdminUiStore = create<AdminUiState>((set) => ({
  theme: 'light', // Admin panel defaults to light
  resolvedTheme: 'light',
  sidebarCollapsed: false,

  setTheme: (theme) => {
    const resolved = resolveTheme(theme)
    set({ theme, resolvedTheme: resolved })
    localStorage.setItem('admin-escriba-theme', theme)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))

// Initialize theme from localStorage
const saved = localStorage.getItem('admin-escriba-theme') as AdminTheme | null
if (saved) {
  useAdminUiStore.getState().setTheme(saved)
}
