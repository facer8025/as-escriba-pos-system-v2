import { create } from 'zustand'
import type { AdminUser } from '@/types/admin'

interface AdminAuthState {
  user: AdminUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  totpRequired: boolean
  tempToken: string | null // Token temporal tras login sin TOTP

  login: (email: string, password: string) => Promise<void>
  verifyTotp: (code: string) => Promise<void>
  refreshSession: () => Promise<boolean>
  logout: () => void
  setUser: (user: AdminUser) => void
  setTokens: (access: string, refresh: string) => void
}

// Persistir tokens en sessionStorage (no localStorage — más seguro)
function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  try {
    const access = sessionStorage.getItem('admin_access_token')
    const refresh = sessionStorage.getItem('admin_refresh_token')
    return { accessToken: access, refreshToken: refresh }
  } catch {
    return { accessToken: null, refreshToken: null }
  }
}

function storeTokens(access: string | null, refresh: string | null) {
  try {
    if (access) sessionStorage.setItem('admin_access_token', access)
    else sessionStorage.removeItem('admin_access_token')
    if (refresh) sessionStorage.setItem('admin_refresh_token', refresh)
    else sessionStorage.removeItem('admin_refresh_token')
  } catch {
    // Silently fail if sessionStorage is unavailable
  }
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  user: null,
  accessToken: getStoredTokens().accessToken,
  refreshToken: getStoredTokens().refreshToken,
  isAuthenticated: !!getStoredTokens().accessToken,
  totpRequired: false,
  tempToken: null,

  login: async (email: string, password: string) => {
    const response = await fetch('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Error al iniciar sesión')
    }

    // Desempaquetar ApiResponse wrapper: { success, data: { ... } }
    const { data } = await response.json()

    if (data.totpRequired) {
      set({ totpRequired: true, tempToken: data.tempToken })
      return
    }

    set({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
      totpRequired: false,
      tempToken: null,
    })
    storeTokens(data.accessToken, data.refreshToken)
  },

  verifyTotp: async (code: string) => {
    const { tempToken } = get()
    if (!tempToken) throw new Error('No hay sesión pendiente de verificación')

    const response = await fetch('/api/v1/admin/auth/login/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken, code }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Código inválido')
    }

    // Desempaquetar ApiResponse wrapper
    const { data } = await response.json()
    set({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
      totpRequired: false,
      tempToken: null,
    })
    storeTokens(data.accessToken, data.refreshToken)
  },

  refreshSession: async () => {
    const { refreshToken } = get()
    if (!refreshToken) return false

    try {
      const response = await fetch('/api/v1/admin/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) return false

      // Desempaquetar ApiResponse wrapper
      const { data } = await response.json()
      set({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      })
      storeTokens(data.accessToken, data.refreshToken)
      return true
    } catch {
      return false
    }
  },

  logout: () => {
    const { refreshToken } = get()
    // Try to invalidate refresh token on server
    if (refreshToken) {
      fetch('/api/v1/admin/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {})
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      totpRequired: false,
      tempToken: null,
    })
    storeTokens(null, null)
  },

  setUser: (user: AdminUser) => set({ user }),
  setTokens: (access: string, refresh: string) => {
    set({ accessToken: access, refreshToken: refresh })
    storeTokens(access, refresh)
  },
}))
