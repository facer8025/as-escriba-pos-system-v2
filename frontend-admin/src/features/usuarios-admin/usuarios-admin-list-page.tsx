import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Loader2, Shield, ShieldOff, UserCog,
  Mail, Phone, Briefcase,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { AdminUser } from '@/types/admin'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { getAdminRoleBadgeClass, getAdminRoleName } from '@/lib/utils'
import { Modal } from '@/components/ui/modal'

export function UsuariosAdminListPage() {
  const { user } = useAdminAuthStore()
  const canWrite = user?.role === 'SA'
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [roles, setRoles] = useState<{ code: string; name: string }[]>([])

  const loadUsers = useCallback(() => {
    setLoading(true)
    api.get('/admin-users').then((r: any) => {
      const d = r?.data ?? r
      setUsers(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])
  useEffect(() => {
    setRoles([
      { code: 'SA', name: 'Super Admin' },
      { code: 'AC', name: 'Admin Comercial' },
      { code: 'AF', name: 'Admin Financiero' },
      { code: 'ST', name: 'Soporte Técnico' },
      { code: 'AU', name: 'Auditor' },
    ])
  }, [])

  const handleToggleBlock = async (id: string) => {
    try {
      await api.post(`/admin-users/${id}/toggle-block`)
      loadUsers()
    } catch (err: any) { alert(err?.message || 'Error') }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Usuarios administradores</h1>
          <p className="text-sm text-neutral-500 mt-1">Gestión del equipo interno ESCRIBA</p>
        </div>
        {canWrite && (
          <button onClick={() => { setEditingUser(null); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-escriba-600 hover:bg-escriba-700 text-white text-sm font-medium transition-all cursor-pointer">
            <Plus className="w-4 h-4" />
            Nuevo admin
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border p-3 text-center">
          <p className="text-lg font-bold text-escriba-600">{users.filter(u => u.status === 'ACTIVE').length}</p>
          <p className="text-[10px] text-neutral-400">Activos</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border p-3 text-center">
          <p className="text-lg font-bold text-danger-600">{users.filter(u => u.status === 'BLOCKED').length}</p>
          <p className="text-[10px] text-neutral-400">Bloqueados</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border p-3 text-center">
          <p className="text-lg font-bold text-green-600">{users.filter(u => u.totpEnabled).length}</p>
          <p className="text-[10px] text-neutral-400">2FA activo</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border p-3 text-center">
          <p className="text-lg font-bold text-neutral-600 dark:text-neutral-300">{users.length}</p>
          <p className="text-[10px] text-neutral-400">Total</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-escriba-500" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <UserCog className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay usuarios admin</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Cargo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">2FA</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Último acceso</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-escriba-50 dark:bg-escriba-900/20 flex items-center justify-center text-escriba-600 dark:text-escriba-400 font-semibold text-sm">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-neutral-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getAdminRoleBadgeClass(user.role)}`}>
                      {getAdminRoleName(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-neutral-500">{user.position || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${user.totpEnabled ? 'text-green-600 dark:text-green-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
                      {user.totpEnabled ? '✅ Activo' : '❌ Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      user.status === 'ACTIVE' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                      user.status === 'BLOCKED' ? 'bg-danger-50 text-danger-600 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300'
                    }`}>
                      {user.status === 'ACTIVE' ? 'Activo' : 'Bloqueado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canWrite && (
                        <>
                          <button onClick={() => { setEditingUser(user); setShowModal(true) }}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-escriba-600 dark:hover:text-escriba-400 hover:bg-escriba-50 dark:hover:bg-escriba-900/20 cursor-pointer"
                            title="Editar">
                            <UserCog className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleBlock(user.id)}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              user.status === 'BLOCKED'
                                ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                : 'text-danger-400 hover:bg-danger-50 dark:hover:bg-red-900/20'
                            }`}
                            title={user.status === 'BLOCKED' ? 'Desbloquear' : 'Bloquear'}>
                            {user.status === 'BLOCKED' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <UserModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingUser(null) }}
        user={editingUser}
        roles={roles}
        onSaved={() => { setShowModal(false); setEditingUser(null); loadUsers() }}
      />
    </motion.div>
  )
}

function UserModal({ isOpen, onClose, user, roles, onSaved }: {
  isOpen: boolean
  onClose: () => void
  user: AdminUser | null
  roles: { code: string; name: string }[]
  onSaved: () => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('ST')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setEmail(user.email)
      setRole(user.role)
      setPhone(user.phone || '')
      setPosition(user.position || '')
      setPassword('')
    } else {
      setFirstName(''); setLastName(''); setEmail('')
      setRole('ST'); setPhone(''); setPosition(''); setPassword('')
    }
    setError(null)
  }, [user, isOpen])

  const handleSave = async () => {
    setError(null)
    if (!firstName.trim() || !lastName.trim()) { setError('Nombres y apellidos requeridos'); return }
    if (!user && !email.trim()) { setError('Email requerido'); return }

    setSaving(true)
    try {
      if (user) {
        await api.put(`/admin-users/${user.id}`, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
          position: position.trim() || undefined,
          role,
        })
      } else {
        await api.post('/admin-users', {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          role,
          phone: phone.trim() || undefined,
          position: position.trim() || undefined,
          password: password.trim() || undefined,
        })
      }
      onSaved()
    } catch (err: any) { setError(err?.message || 'Error al guardar') }
    finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Editar usuario admin' : 'Nuevo usuario admin'} size="md">
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-danger-50 border border-danger-200 text-sm text-danger-600">{error}</div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nombres *</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apellidos *</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="input w-full" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email {!user && '*'}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            disabled={!!user} className="input w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Rol</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="input w-full">
              {roles.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="input w-full" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cargo</label>
          <input type="text" value={position} onChange={e => setPosition(e.target.value)}
            placeholder="Ej: Líder de soporte" className="input w-full" />
        </div>
        {!user && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Contraseña <span className="text-neutral-400 font-normal">(opcional, se genera automáticamente)</span>
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Dejar vacío para generar" className="input w-full" />
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary cursor-pointer">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 cursor-pointer">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {user ? 'Actualizar' : 'Crear usuario'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
