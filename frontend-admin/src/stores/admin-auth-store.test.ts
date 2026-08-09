import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import type { AdminUser } from '@/types/admin'

// Mock global de fetch
const mockFetch = vi.fn()

const mockUser: AdminUser = {
  id: 'u1',
  email: 'admin@escriba.co',
  firstName: 'Admin',
  lastName: 'Principal',
  role: 'SA',
  roleName: 'Super Admin',
  status: 'ACTIVE',
  totpEnabled: false,
  createdAt: '2026-01-01T00:00:00Z',
}

function apiResponse(data: unknown) {
  return { ok: true, json: async () => ({ success: true, data }) } as Response
}

function apiError(status: number, message: string) {
  return {
    ok: false,
    status,
    json: async () => ({ success: false, message }),
  } as Response
}

beforeEach(() => {
  mockFetch.mockReset()
  vi.stubGlobal('fetch', mockFetch)
  useAdminAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    totpRequired: false,
    tempToken: null,
  })
  sessionStorage.clear()
})

describe('admin-auth-store', () => {
  it('login exitoso establece usuario, tokens y autenticación', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({ user: mockUser, accessToken: 'at-1', refreshToken: 'rt-1' })
    )

    await useAdminAuthStore.getState().login('admin@escriba.co', 'clave123')

    const state = useAdminAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.email).toBe('admin@escriba.co')
    expect(state.accessToken).toBe('at-1')
    expect(state.refreshToken).toBe('rt-1')
    expect(state.totpRequired).toBe(false)

    // Verifica el cuerpo de la petición
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/admin/auth/login', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@escriba.co', password: 'clave123' }),
    }))

    // Tokens persistidos en sessionStorage
    expect(sessionStorage.getItem('admin_access_token')).toBe('at-1')
    expect(sessionStorage.getItem('admin_refresh_token')).toBe('rt-1')
  })

  it('login con TOTP requerido marca totpRequired y guarda tempToken', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({ totpRequired: true, tempToken: 'temp-123' })
    )

    await useAdminAuthStore.getState().login('admin@escriba.co', 'clave123')

    const state = useAdminAuthStore.getState()
    expect(state.totpRequired).toBe(true)
    expect(state.tempToken).toBe('temp-123')
    expect(state.isAuthenticated).toBe(false)
    expect(sessionStorage.getItem('admin_access_token')).toBeNull()
  })

  it('login fallido lanza el mensaje del servidor', async () => {
    mockFetch.mockResolvedValue(apiError(401, 'Credenciales incorrectas'))

    await expect(
      useAdminAuthStore.getState().login('admin@escriba.co', 'mal')
    ).rejects.toThrow('Credenciales incorrectas')

    expect(useAdminAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('verifyTotp completa la autenticación tras el código 2FA', async () => {
    useAdminAuthStore.setState({ totpRequired: true, tempToken: 'temp-123' })
    mockFetch.mockResolvedValue(
      apiResponse({ user: mockUser, accessToken: 'at-2', refreshToken: 'rt-2' })
    )

    await useAdminAuthStore.getState().verifyTotp('123456')

    const state = useAdminAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.totpRequired).toBe(false)
    expect(state.tempToken).toBeNull()
    expect(state.accessToken).toBe('at-2')

    expect(mockFetch).toHaveBeenCalledWith('/api/v1/admin/auth/login/verify-2fa', expect.objectContaining({
      body: JSON.stringify({ tempToken: 'temp-123', code: '123456' }),
    }))
  })

  it('verifyTotp sin sesión pendiente lanza error', async () => {
    await expect(useAdminAuthStore.getState().verifyTotp('123456'))
      .rejects.toThrow('No hay sesión pendiente de verificación')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('logout limpia el estado y los tokens', () => {
    useAdminAuthStore.setState({
      user: mockUser,
      accessToken: 'at-1',
      refreshToken: 'rt-1',
      isAuthenticated: true,
    })
    sessionStorage.setItem('admin_access_token', 'at-1')
    sessionStorage.setItem('admin_refresh_token', 'rt-1')

    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) } as Response)
    useAdminAuthStore.getState().logout()

    const state = useAdminAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(sessionStorage.getItem('admin_access_token')).toBeNull()
    expect(sessionStorage.getItem('admin_refresh_token')).toBeNull()
  })

  it('refreshSession renueva tokens con refresh token válido', async () => {
    useAdminAuthStore.setState({ refreshToken: 'rt-válido' })
    mockFetch.mockResolvedValue(
      apiResponse({ accessToken: 'at-nuevo', refreshToken: 'rt-nuevo' })
    )

    const ok = await useAdminAuthStore.getState().refreshSession()

    expect(ok).toBe(true)
    expect(useAdminAuthStore.getState().accessToken).toBe('at-nuevo')
    expect(useAdminAuthStore.getState().refreshToken).toBe('rt-nuevo')
    expect(sessionStorage.getItem('admin_access_token')).toBe('at-nuevo')
  })

  it('refreshSession sin refresh token retorna false', async () => {
    const ok = await useAdminAuthStore.getState().refreshSession()
    expect(ok).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
