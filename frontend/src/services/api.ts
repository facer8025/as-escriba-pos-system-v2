import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/**
 * Decodifica un JWT sin verificar firma y retorna el payload.
 * Útil para comprobar expiración del lado del cliente.
 */
function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/**
 * Verifica si un JWT está expirado (considerando un margen de 10 segundos).
 */
function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  // exp está en segundos, Date.now() en milisegundos
  return (decoded.exp as number) * 1000 < Date.now() + 10000;
}

// Request interceptor - add auth token + refresh si expiró
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken, refreshToken, logout, setTokens } = useAuthStore.getState();

    if (!accessToken) return config;

    // Si el token expiró y tenemos refresh, intentar renovar primero
    if (isTokenExpired(accessToken) && refreshToken) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
          params: { refreshToken },
        });
        const { accessToken: newToken } = response.data.data;
        setTokens(newToken, refreshToken);
        config.headers.Authorization = `Bearer ${newToken}`;
        return config;
      } catch {
        logout();
        window.location.href = '/login';
        return Promise.reject(new Error('Sesión expirada'));
      }
    }

    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 o 403 por token expirado - try refresh token
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, logout, setTokens } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
            params: { refreshToken },
          });
          const { accessToken } = response.data.data;
          setTokens(accessToken, refreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          logout();
          window.location.href = '/login';
        }
      } else {
        logout();
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }

    // Show error toast for non-auth errors
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      const message = (error.response?.data as any)?.message || error.message;
      toast.error(message || 'Error de conexión');
    }

    return Promise.reject(error);
  }
);

export default api;
