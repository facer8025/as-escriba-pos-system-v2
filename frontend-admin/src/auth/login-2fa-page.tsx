import { useState, FormEvent, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { Shield, AlertCircle, Smartphone } from 'lucide-react'

export function Login2FAPage() {
  const navigate = useNavigate()
  const { verifyTotp, totpRequired, isAuthenticated } = useAdminAuthStore()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  if (!totpRequired && !isAuthenticated) {
    navigate('/login', { replace: true })
    return null
  }

  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'Enter') {
      handleSubmitCode()
    }
  }

  const handleSubmitCode = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Ingresa el código completo de 6 dígitos')
      return
    }

    setError('')
    setLoading(true)

    try {
      await verifyTotp(fullCode)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await handleSubmitCode()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-100 to-escriba-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-escriba-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-escriba-600 shadow-lg shadow-escriba-600/20 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Verificación en dos pasos
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Panel Administrativo ESCRIBA
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-escriba-50 dark:bg-escriba-900/20 border border-escriba-200 dark:border-escriba-800">
            <Smartphone className="w-5 h-5 text-escriba-600 shrink-0" />
            <p className="text-sm text-escriba-700 dark:text-escriba-400">
              Ingresa el código de 6 dígitos de tu aplicación de autenticación
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-danger-50 dark:bg-red-900/20 border border-danger-200 dark:border-red-800 text-sm text-danger-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-3 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-mono font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-escriba-500/20 focus:border-escriba-500 transition-all"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.join('').length !== 6}
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
                'Verificar'
              )}
            </button>
          </form>

          <button
            onClick={() => {
              useAdminAuthStore.getState().logout()
              navigate('/login', { replace: true })
            }}
            className="w-full mt-3 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  )
}
