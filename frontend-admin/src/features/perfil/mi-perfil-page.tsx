import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Loader2, Save, Lock, ShieldCheck, Shield, Mail, KeyRound,
} from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { showToast } from '@/lib/toast'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { getAdminRoleBadgeClass, getAdminRoleName } from '@/lib/utils'
import type { AdminUser } from '@/types/admin'

interface ApiResult<T> {
  success: boolean
  message?: string
  data: T
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError || err instanceof Error) return err.message
  return 'Error al procesar la solicitud'
}

export function MiPerfilPage() {
  const { user } = useAdminAuthStore()

  if (!user) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-escriba-500" />
      </div>
    )
  }

  return <PerfilForm user={user} />
}

function PerfilForm({ user }: { user: AdminUser }) {
  const { setUser } = useAdminAuthStore()

  const [firstName, setFirstName] = useState(user.firstName || '')
  const [lastName, setLastName] = useState(user.lastName || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [position, setPosition] = useState(user.position || '')
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [changing, setChanging] = useState(false)

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showToast('Nombres y apellidos son requeridos', 'error')
      return
    }
    setSaving(true)
    try {
      const r = await api.put<ApiResult<AdminUser>>('/auth/me', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        position: position.trim() || undefined,
      })
      const updated = r?.data
      if (updated?.id) setUser({ ...user, ...updated })
      showToast('Perfil actualizado', 'success')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwdError(null)
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError('Completa todos los campos de contraseña')
      return
    }
    if (newPassword.length < 12) {
      setPwdError('La nueva contraseña debe tener al menos 12 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwdError('La confirmación no coincide con la nueva contraseña')
      return
    }
    setChanging(true)
    try {
      await api.post<ApiResult<void>>('/auth/change-password', { currentPassword, newPassword })
      showToast('Contraseña actualizada', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setChanging(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Mi perfil</h1>
        <p className="text-sm text-neutral-500 mt-1">Datos personales y seguridad de tu cuenta</p>
      </div>

      {/* Header de usuario */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-escriba-100 dark:bg-escriba-900/30 flex items-center justify-center text-escriba-700 dark:text-escriba-400 font-bold text-2xl shrink-0">
          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-neutral-500 flex items-center gap-1.5 mt-0.5">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{user.email}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getAdminRoleBadgeClass(user.role)}`}>
              {getAdminRoleName(user.role)}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
              user.totpEnabled
                ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300'
            }`}>
              {user.totpEnabled ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
              2FA {user.totpEnabled ? 'activo' : 'pendiente'}
            </span>
          </div>
        </div>
      </div>

      {/* Información personal */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Información personal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombres *</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apellidos *</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Agregar teléfono" className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cargo</label>
            <input type="text" value={position} onChange={e => setPosition(e.target.value)} placeholder="Ej: Líder de soporte" className="input w-full" />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSaveProfile} disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 cursor-pointer">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-neutral-400" />
          Cambiar contraseña
        </h3>
        {pwdError && (
          <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-sm text-danger-600">{pwdError}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña actual</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmar contraseña</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input w-full" />
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-neutral-400">
          <Lock className="w-3 h-3" /> Mínimo 12 caracteres. Al cambiarla se cerrarán otras sesiones activas.
        </p>
        <div className="flex justify-end">
          <button onClick={handleChangePassword} disabled={changing}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 cursor-pointer">
            {changing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Actualizar contraseña
          </button>
        </div>
      </div>
    </motion.div>
  )
}