import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, totpRequired, isAuthenticated } = useAdminAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  // Redirect to 2FA if required
  if (totpRequired) {
    navigate('/login/2fa', { replace: true })
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // If totpRequired, the store updates and the redirect above happens
      if (!useAdminAuthStore.getState().totpRequired) {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-100 to-escriba-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-escriba-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-escriba-600 shadow-lg shadow-escriba-600/20 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            ESCRIBA
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Panel Administrativo
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
            Iniciar sesión
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            Ingresa tus credenciales de administrador
          </p>

          {error && (
            <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-danger-50 dark:bg-red-900/20 border border-danger-200 dark:border-red-800 text-sm text-danger-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@escriba.co"
                required
                autoFocus
                className="w-full h-11 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-escriba-500/20 focus:border-escriba-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={12}
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-escriba-500/20 focus:border-escriba-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-escriba-600 hover:bg-escriba-700 text-white font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <p className="text-xs text-neutral-400 mt-6 text-center">
            Acceso restringido solo para personal autorizado de ESCRIBA
          </p>
        </div>
      </div>
    </div>
  )
}
