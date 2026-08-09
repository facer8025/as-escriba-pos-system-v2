import { useAdminAuthStore } from '@/stores/admin-auth-store'

const API_BASE = '/api/v1/admin'

interface ApiOptions {
  method?: string
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
  headers?: Record<string, string>
}

class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, params, headers = {} } = options

  // Build URL with query params
  let url = `${API_BASE}${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }

  // Headers
  const authStore = useAdminAuthStore.getState()
  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (authStore.accessToken) {
    finalHeaders['Authorization'] = `Bearer ${authStore.accessToken}`
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Handle 401 — try refresh
  if (response.status === 401 && authStore.refreshToken) {
    try {
      const refreshed = await authStore.refreshSession()
      if (refreshed) {
        finalHeaders['Authorization'] = `Bearer ${authStore.accessToken}`
        const retryResponse = await fetch(url, {
          method,
          headers: finalHeaders,
          body: body ? JSON.stringify(body) : undefined,
        })
        if (!retryResponse.ok) {
          const retryError = await retryResponse.json().catch(() => ({ message: retryResponse.statusText }))
          throw new ApiError(retryResponse.status, retryError.message || 'Error en la solicitud', retryError)
        }
        return retryResponse.json()
      }
    } catch {
      authStore.logout()
      window.location.href = '/login'
      throw new ApiError(401, 'Sesión expirada')
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }))
    throw new ApiError(response.status, errorData.message || 'Error en la solicitud', errorData)
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T

  return response.json()
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(endpoint, { params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),
}

export { ApiError }
