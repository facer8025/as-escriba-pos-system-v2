import { beforeEach, describe, it, expect } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import type { AuthResponse } from '@/types'

const mockAuth: AuthResponse = {
  userId: 'u1',
  email: 'cajero@escriba.co',
  fullName: 'Juan Pérez',
  role: 'CA',
  roleName: 'Cajero',
  companyId: 'c1',
  companyName: 'ESCRIBA SAS',
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  tokenType: 'Bearer',
  expiresIn: 86400000,
  mustChangePassword: false,
} as AuthResponse

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
  })
  useAuthStore.persist.clearStorage()
  localStorage.clear()
})

describe('authStore (panel cliente)', () => {
  it('setAuth establece usuario, tokens y autenticación', () => {
    useAuthStore.getState().setAuth(mockAuth)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.accessToken).toBe('access-1')
    expect(state.refreshToken).toBe('refresh-1')
    expect(state.user?.fullName).toBe('Juan Pérez')
  })

  it('setTokens actualiza solo los tokens', () => {
    useAuthStore.getState().setTokens('access-nuevo', 'refresh-nuevo')

    expect(useAuthStore.getState().accessToken).toBe('access-nuevo')
    expect(useAuthStore.getState().refreshToken).toBe('refresh-nuevo')
  })

  it('updateUser fusiona campos del usuario', () => {
    useAuthStore.getState().setAuth(mockAuth)
    useAuthStore.getState().updateUser({ fullName: 'Juan Carlos Pérez' })

    expect(useAuthStore.getState().user?.fullName).toBe('Juan Carlos Pérez')
    expect(useAuthStore.getState().user?.email).toBe('cajero@escriba.co')
  })

  it('updateUser sin usuario no rompe', () => {
    useAuthStore.getState().updateUser({ fullName: 'X' })
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('logout limpia todo el estado', () => {
    useAuthStore.getState().setAuth(mockAuth)
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
  })

  it('persiste el estado en localStorage', () => {
    useAuthStore.getState().setAuth(mockAuth)

    const raw = localStorage.getItem('escriba-auth-storage')
    expect(raw).toBeTruthy()
    const persisted = JSON.parse(raw as string)
    expect(persisted.state.accessToken).toBe('access-1')
    expect(persisted.state.isAuthenticated).toBe(true)
  })
})
