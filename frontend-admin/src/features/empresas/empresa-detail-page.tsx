import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, ExternalLink, Edit3, Loader2, AlertTriangle, Key, FileText, Ticket, Activity, Wrench, Plus, X, Check, Pencil, Trash2, RefreshCw, Ban, ToggleLeft, UserCog, Eye, EyeOff, Wand2 } from 'lucide-react'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getTenantStatusBadgeClass } from '@/lib/utils'
import type { AdminRoleCode, Tenant, License, Plan } from '@/types/admin'

const LICENSE_STATUSES = [
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'TRIAL', label: 'Trial' },
  { value: 'SUSPENDED', label: 'Suspendida' },
  { value: 'EXPIRED', label: 'Vencida' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

const DURATIONS = [
  { value: 1, label: '1 mes' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '1 año' },
  { value: 24, label: '2 años' },
]

const TENANT_STATUSES = [
  { value: 'TRIAL', label: 'Trial' },
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'SUSPENDED', label: 'Suspendida' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

interface TenantUser {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  roleCode?: string
  roleName?: string
  active: boolean
  mustChangePassword: boolean
  lastLogin?: string
  createdAt?: string
}

function toDateInput(iso?: string): string {
  return iso ? iso.slice(0, 10) : ''
}

export function EmpresaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAdminAuthStore()
  const userRole = user?.role as AdminRoleCode
  const canWrite = userRole === 'SA' || userRole === 'AC' || userRole === 'AF'
  // Roles de solo lectura: pueden ver la empresa pero no ejecutar acciones de escritura
  const isReadOnly = userRole === 'ST' || userRole === 'AU'
  const readOnlyTip = isReadOnly
    ? `Tu rol (${userRole}) es de solo lectura. Solicita el cambio a un Super Admin o Admin Comercial.`
    : undefined
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('resumen')
  const [showImpersonateModal, setShowImpersonateModal] = useState(false)
  const [impersonateReason, setImpersonateReason] = useState('')

  // Cambio de estado de la empresa
  const [statusModal, setStatusModal] = useState(false)
  const [statusForm, setStatusForm] = useState({ status: '', reason: '' })

  // Acceso del admin: usuarios + contraseña
  const [accessModal, setAccessModal] = useState(false)
  const [users, setUsers] = useState<TenantUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ password: '', show: false })
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  // Licencias y planes
  const [licenses, setLicenses] = useState<License[]>([])
  const [licensesLoading, setLicensesLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  // Modal state: null | 'manage' (gestionar licencia) | 'plan' (cambiar plan)
  const [licenseModal, setLicenseModal] = useState<null | 'manage' | 'plan'>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState(0)
  const [form, setForm] = useState({
    licenseType: 'PAID', status: 'ACTIVE', startsAt: '', expiresAt: '',
    durationMonths: 12, autoRenew: true, gracePeriodDays: 7,
    discountPct: 0, discountReason: '', notes: '',
  })

  const update = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  const fetchTenant = useCallback(() => {
    if (!id) return
    api.get(`/tenants/${id}`)
      .then((response: any) => {
        const data = response?.data ?? response
        setTenant(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Error al cargar datos de la empresa')
        setLoading(false)
      })
  }, [id])

  const fetchUsers = useCallback(() => {
    if (!id) return
    setUsersLoading(true)
    api.get(`/tenants/${id}/users`)
      .then((response: any) => {
        const data = response?.data ?? response
        setUsers(Array.isArray(data) ? data : [])
        setUsersLoading(false)
      })
      .catch(() => { setUsersLoading(false); setUsers([]) })
  }, [id])

  const fetchLicenses = useCallback(() => {
    if (!id) return
    setLicensesLoading(true)
    api.get('/licenses', { tenantId: id, page: '0', size: '50' })
      .then((response: any) => {
        const data = response?.data ?? response
        setLicenses(data?.content ?? data ?? [])
        setLicensesLoading(false)
      })
      .catch(() => setLicensesLoading(false))
  }, [id])

  useEffect(() => { fetchTenant() }, [fetchTenant])
  useEffect(() => { fetchLicenses() }, [fetchLicenses])

  useEffect(() => {
    api.get('/plans').then((r: any) => {
      const d = r?.data ?? r
      setPlans((Array.isArray(d) ? d : d?.content ?? []).filter((p: Plan) => p.status === 'ACTIVE'))
    }).catch(() => {})
  }, [])

  const handleImpersonate = async () => {
    if (!impersonateReason.trim() || !id) return
    try {
      const response: any = await api.post(`/tenants/${id}/impersonate`, { reason: impersonateReason })
      const data = response?.data ?? response
      if (data?.token) {
        const impersonationUrl = `${window.location.origin}/app/impersonate?token=${data.token}`
        window.open(impersonationUrl, '_blank')
        setShowImpersonateModal(false)
        setImpersonateReason('')
      }
    } catch (err: any) {
      alert(err?.message || 'Error al generar token de acceso')
    }
  }

  // ============ CAMBIO DE ESTADO ============
  const openStatusModal = () => {
    setStatusForm({ status: tenant?.status ?? '', reason: '' })
    setStatusModal(true)
  }

  const handleChangeStatus = async () => {
    if (!id || !statusForm.status) return
    const needsReason = statusForm.status === 'SUSPENDED' || statusForm.status === 'CANCELLED'
    if (needsReason && !statusForm.reason.trim()) {
      alert('El motivo es obligatorio para suspender o cancelar la empresa')
      return
    }
    setSubmitting(true)
    try {
      await api.patch(`/tenants/${id}/status`, undefined, {
        status: statusForm.status,
        reason: statusForm.reason.trim() || undefined,
      })
      alert('Estado de la empresa actualizado')
      setStatusModal(false)
      fetchTenant()
    } catch (err: any) {
      alert(err?.message || 'Error al cambiar el estado')
    } finally { setSubmitting(false) }
  }

  // ============ ACCESO DEL ADMIN (USUARIO/CONTRASEÑA) ============
  const openAccessModal = () => {
    setPasswordForm({ password: '', show: false })
    setTempPassword(null)
    setAccessModal(true)
    fetchUsers()
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
    let pw = ''
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)]
    setPasswordForm(p => ({ ...p, password: pw, show: true }))
  }

  const handleResetPassword = async () => {
    if (!id) return
    setSubmitting(true)
    setTempPassword(null)
    try {
      const response: any = await api.post(`/tenants/${id}/reset-password`, {
        password: passwordForm.password.trim() || undefined,
      })
      const data = response?.data ?? response
      setTempPassword(data?.tempPassword ?? null)
      setPasswordForm({ password: '', show: false })
      alert('Contraseña del admin asignada correctamente')
      fetchTenant()
      fetchUsers()
    } catch (err: any) {
      alert(err?.message || 'Error al asignar la contraseña')
    } finally { setSubmitting(false) }
  }

  // ============ GESTIONAR LICENCIA ============
  const openManageLicense = () => {
    const current = licenses[0] ?? null
    setEditingLicense(current)
    setSelectedPlanId(current?.planId ?? 0)
    if (current) {
      setForm({
        licenseType: current.licenseType,
        status: current.status,
        startsAt: toDateInput(current.startsAt),
        expiresAt: toDateInput(current.expiresAt),
        durationMonths: 12,
        autoRenew: current.autoRenew,
        gracePeriodDays: current.gracePeriodDays,
        discountPct: current.discountPct ?? 0,
        discountReason: current.discountReason ?? '',
        notes: current.notes ?? '',
      })
    } else {
      setForm({
        licenseType: 'PAID', status: 'ACTIVE', startsAt: '', expiresAt: '',
        durationMonths: 12, autoRenew: true, gracePeriodDays: 7,
        discountPct: 0, discountReason: '', notes: '',
      })
    }
    setLicenseModal('manage')
  }

  const handleCreateLicense = async () => {
    if (!id || !selectedPlanId) { alert('Selecciona un plan'); return }
    setSubmitting(true)
    try {
      const startDate = form.startsAt || new Date().toISOString().split('T')[0]
      await api.post('/licenses', {
        tenantId: id,
        planId: Number(selectedPlanId),
        licenseType: form.licenseType,
        startDate,
        durationMonths: Number(form.durationMonths),
        autoRenew: form.autoRenew,
        gracePeriodDays: Number(form.gracePeriodDays),
        discountPct: Number(form.discountPct) || 0,
        discountReason: form.discountReason,
        notes: form.notes,
        notifyTenant: true,
      })
      alert('Licencia creada exitosamente')
      setLicenseModal(null)
      fetchLicenses()
    } catch (err: any) {
      alert(err?.message || 'Error al crear licencia')
    } finally { setSubmitting(false) }
  }

  const handleUpdateLicense = async () => {
    if (!editingLicense) return
    setSubmitting(true)
    try {
      await api.put(`/licenses/${editingLicense.id}`, {
        planId: Number(selectedPlanId),
        licenseType: form.licenseType,
        status: form.status,
        startsAt: form.startsAt || undefined,
        expiresAt: form.expiresAt || undefined,
        autoRenew: form.autoRenew,
        gracePeriodDays: Number(form.gracePeriodDays),
        discountPct: Number(form.discountPct) || 0,
        discountReason: form.discountReason,
        notes: form.notes,
      })
      alert('Licencia actualizada exitosamente')
      setLicenseModal(null)
      fetchLicenses()
    } catch (err: any) {
      alert(err?.message || 'Error al actualizar licencia')
    } finally { setSubmitting(false) }
  }

  const handleRenewLicense = async () => {
    if (!editingLicense) return
    setSubmitting(true)
    try {
      const response: any = await api.post(`/licenses/${editingLicense.id}/renew`)
      const data = response?.data ?? response
      setEditingLicense(data)
      alert('Licencia renovada +1 mes')
      fetchLicenses()
    } catch (err: any) {
      alert(err?.message || 'Error al renovar licencia')
    } finally { setSubmitting(false) }
  }

  const handleRenewLicenseFromTable = async (lic: License) => {
    setSubmitting(true)
    try {
      await api.post(`/licenses/${lic.id}/renew`)
      alert(`Licencia de ${lic.planName} renovada +1 mes`)
      fetchLicenses()
    } catch (err: any) {
      alert(err?.message || 'Error al renovar licencia')
    } finally { setSubmitting(false) }
  }

  const handleDeleteLicense = async () => {
    if (!editingLicense) return
    setSubmitting(true)
    try {
      await api.delete(`/licenses/${editingLicense.id}`)
      alert('Licencia eliminada')
      setLicenseModal(null)
      setEditingLicense(null)
      fetchLicenses()
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar licencia')
    } finally { setSubmitting(false) }
  }

  // ============ CAMBIAR PLAN ============
  const openChangePlan = () => {
    const current = licenses[0] ?? null
    setEditingLicense(current)
    setSelectedPlanId(current?.planId ?? 0)
    setLicenseModal('plan')
  }

  const handleChangePlan = async () => {
    if (!editingLicense || !selectedPlanId) { alert('Selecciona un plan'); return }
    if (selectedPlanId === editingLicense.planId) { alert('Selecciona un plan diferente al actual'); return }
    setSubmitting(true)
    try {
      const response: any = await api.post(`/licenses/${editingLicense.id}/change-plan`, undefined, { planId: String(selectedPlanId) })
      const data = response?.data ?? response
      alert(`Plan cambiado a ${data?.planName ?? 'nuevo plan'}`)
      setLicenseModal(null)
      fetchLicenses()
    } catch (err: any) {
      alert(err?.message || 'Error al cambiar plan')
    } finally { setSubmitting(false) }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-success-50 text-success-600 dark:bg-green-900/20 dark:text-green-400',
      TRIAL: 'bg-info-50 text-info-600 dark:bg-blue-900/20 dark:text-blue-400',
      EXPIRED: 'bg-danger-50 text-danger-600 dark:bg-red-900/20 dark:text-red-400',
      SUSPENDED: 'bg-warning-50 text-warning-600 dark:bg-amber-900/20 dark:text-amber-400',
      CANCELLED: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    }
    return map[status] || 'bg-neutral-100 text-neutral-500'
  }

  const statusLabel = (s: string) => LICENSE_STATUSES.find(o => o.value === s)?.label ?? s
  const daysLeft = (expiresAt?: string) => {
    if (!expiresAt) return null
    const diff = new Date(expiresAt).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const tabs = [
    { id: 'resumen', label: 'Resumen operativo', icon: Building2 },
    { id: 'licencias', label: 'Licencias', icon: Key },
    { id: 'facturacion', label: 'Facturación', icon: FileText },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'auditoria', label: 'Auditoría', icon: Activity },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-escriba-500" /></div>
  }

  if (error || !tenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">{error || 'Empresa no encontrada'}</p>
          <Link to="/empresas" className="text-escriba-600 text-sm mt-2 inline-block hover:underline">Volver a empresas</Link>
        </div>
      </div>
    )
  }

  const currentLicense = licenses[0] ?? null

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/empresas" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{tenant.businessName}</h1>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getTenantStatusBadgeClass(tenant.status)}`}>
              {tenant.status === 'ACTIVE' ? 'Activa' : tenant.status === 'TRIAL' ? 'Trial' : tenant.status === 'SUSPENDED' ? 'Suspendida' : 'Cancelada'}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            NIT: {tenant.nit}{tenant.dv ? `-${tenant.dv}` : ''} · {tenant.city || ''}{tenant.department ? `, ${tenant.department}` : ''} · Desde {formatDate(tenant.registeredAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <>
              <button onClick={() => setShowImpersonateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-escriba-600 hover:bg-escriba-700 text-white text-sm font-medium transition-colors cursor-pointer">
                <ExternalLink className="w-4 h-4" />
                Acceder al panel
              </button>
              <button className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors cursor-pointer">
                <Edit3 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-escriba-500 text-escriba-600 dark:text-escriba-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          {/* Acciones rápidas: visibles para todos los roles con acceso a la página.
              Los roles de solo lectura (ST/AU) las ven deshabilitadas con explicación. */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Acciones rápidas</h4>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getTenantStatusBadgeClass(tenant.status)}`}>
                {tenant.status === 'ACTIVE' ? 'Activa' : tenant.status === 'TRIAL' ? 'Trial' : tenant.status === 'SUSPENDED' ? 'Suspendida' : 'Cancelada'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {canWrite && (
                <button onClick={() => setShowImpersonateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-escriba-50 dark:bg-escriba-900/20 text-escriba-600 dark:text-escriba-300 text-sm font-medium transition-colors cursor-pointer hover:bg-escriba-100 dark:hover:bg-escriba-900/40">
                  <ExternalLink className="w-4 h-4" />
                  Acceder al panel de la empresa
                </button>
              )}
              <button onClick={openManageLicense} disabled={isReadOnly} title={readOnlyTip}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                <Key className="w-4 h-4 text-amber-500" />
                Gestionar licencia
              </button>
              <button onClick={openChangePlan} disabled={isReadOnly} title={readOnlyTip}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                <Wrench className="w-4 h-4 text-neutral-400" />
                Cambiar plan
              </button>
              <button onClick={openStatusModal} disabled={isReadOnly} title={readOnlyTip}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-info-50 dark:bg-blue-900/20 text-info-600 dark:text-info-300 text-sm font-medium transition-colors cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                <ToggleLeft className="w-4 h-4" />
                Cambiar estado de la empresa
              </button>
              <button onClick={openAccessModal} disabled={isReadOnly} title={readOnlyTip}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-success-50 dark:bg-green-900/20 text-success-600 dark:text-success-300 text-sm font-medium transition-colors cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                <UserCog className="w-4 h-4" />
                Usuario y contraseña del admin
              </button>
            </div>
            {isReadOnly && (
              <p className="text-xs text-neutral-400 mt-3">
                Tu rol ({userRole}) es de solo lectura: las acciones de escritura están deshabilitadas. Solicita el cambio a un Super Admin o Admin Comercial.
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="font-semibold mb-4">Información general</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Razón social" value={tenant.businessName} />
                <InfoRow label="NIT" value={`${tenant.nit}${tenant.dv ? `-${tenant.dv}` : ''}`} />
                <InfoRow label="Nombre comercial" value={tenant.tradeName || '—'} />
                <InfoRow label="Régimen tributario" value={tenant.taxRegime || '—'} />
                <InfoRow label="CIIU" value={tenant.ciiuCode || '—'} />
                <InfoRow label="Email" value={tenant.email} />
                <InfoRow label="Admin del panel" value={tenant.adminEmail ? `${tenant.adminEmail}${tenant.adminUserId ? ' ✅' : ''}` : '—'} />
                <InfoRow label="Teléfono" value={tenant.phone || '—'} />
                <InfoRow label="Ubicación" value={`${tenant.city || ''}${tenant.department ? `, ${tenant.department}` : ''}`} />
                <InfoRow label="Schema BD" value={tenant.schemaName} />
                <InfoRow label="Zona horaria" value={tenant.timezone} />
                <InfoRow label="Registro" value={formatDate(tenant.registeredAt)} />
                <InfoRow label="Estado" value={tenant.status} />
              </div>
            </div>

            {/* Resumen de licencia actual */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Licencia actual</h3>
                <div className="flex gap-2">
                  {canWrite && (
                    <>
                      <button onClick={openManageLicense} className="btn-secondary text-sm">Gestionar licencia</button>
                      <button onClick={openChangePlan} className="btn-primary text-sm">Cambiar plan</button>
                    </>
                  )}
                </div>
              </div>
              {licensesLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-escriba-500" /></div>
              ) : currentLicense ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <InfoCard label="Plan" value={currentLicense.planName} />
                  <InfoCard label="Tipo" value={currentLicense.licenseType === 'PAID' ? 'Paga' : 'Trial'} />
                  <InfoCard label="Estado" value={statusLabel(currentLicense.status)} badge={getStatusBadge(currentLicense.status)} />
                  <InfoCard label="Vence" value={formatDate(currentLicense.expiresAt)} />
                  <InfoCard label="Precio" value={`${formatCurrency(currentLicense.pricePaidMonthly)}/mes`} />
                  <InfoCard label="Renovación" value={currentLicense.autoRenew ? 'Automática' : 'Manual'} />
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-400">
                  <p className="text-sm">Esta empresa no tiene licencia asignada</p>
                  {canWrite && (
                    <button onClick={openManageLicense}
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-escriba-600 hover:bg-escriba-700 text-white text-sm font-medium transition-colors cursor-pointer">
                      <Plus className="w-4 h-4" /> Crear licencia
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {tenant.suspensionReason && (
              <div className="bg-danger-50 dark:bg-red-900/20 rounded-2xl border border-danger-200 dark:border-red-800 p-4">
                <h4 className="text-xs font-semibold text-danger-600 uppercase tracking-wider mb-1">Motivo de suspensión</h4>
                <p className="text-sm text-danger-700 dark:text-danger-400">{tenant.suspensionReason}</p>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {activeTab === 'licencias' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <h3 className="font-semibold">Licencias de {tenant.businessName}</h3>
            {canWrite && (
              <button onClick={openManageLicense}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-escriba-600 hover:bg-escriba-700 text-white text-sm font-medium transition-colors cursor-pointer">
                <Plus className="w-4 h-4" /> Nueva licencia
              </button>
            )}
          </div>
          {licensesLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-escriba-500" /></div>
          ) : licenses.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <p className="text-lg font-medium">Sin licencias</p>
              <p className="text-sm mt-1">Esta empresa no tiene licencias asignadas</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Plan</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Estado</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Inicio</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Vencimiento</th>
                  <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Precio</th>
                  {canWrite && <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {licenses.map((lic) => (
                  <tr key={lic.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {lic.planName}
                      {lic.discountPct > 0 && <span className="text-xs text-success-500 ml-2">-{lic.discountPct}%</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(lic.status)}`}>{statusLabel(lic.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(lic.startsAt)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500">
                      {formatDate(lic.expiresAt)}
                      {daysLeft(lic.expiresAt) !== null && daysLeft(lic.expiresAt)! < 30 && lic.status === 'ACTIVE' && (
                        <span className="text-xs text-danger-500 ml-1">({daysLeft(lic.expiresAt)}d)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-neutral-600 dark:text-neutral-400">{formatCurrency(lic.pricePaidMonthly)}/mes</td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditingLicense(lic); setSelectedPlanId(lic.planId); setForm({
                            licenseType: lic.licenseType, status: lic.status,
                            startsAt: toDateInput(lic.startsAt), expiresAt: toDateInput(lic.expiresAt),
                            durationMonths: 12, autoRenew: lic.autoRenew, gracePeriodDays: lic.gracePeriodDays,
                            discountPct: lic.discountPct ?? 0, discountReason: lic.discountReason ?? '', notes: lic.notes ?? '',
                          }); setLicenseModal('manage') }} title="Editar"
                            className="p-2 rounded-lg hover:bg-escriba-50 dark:hover:bg-escriba-900/20 text-escriba-600 dark:text-escriba-400 transition-colors cursor-pointer">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRenewLicenseFromTable(lic)} title="Renovar +1 mes"
                            className="p-2 rounded-lg hover:bg-success-50 dark:hover:bg-green-900/20 text-success-600 dark:text-success-400 transition-colors cursor-pointer">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab !== 'resumen' && activeTab !== 'licencias' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <p className="text-neutral-400">Módulo en desarrollo</p>
        </div>
      )}

      {/* ============ MODAL: GESTIONAR LICENCIA ============ */}
      {licenseModal === 'manage' && (
        <div className="modal-overlay" onClick={() => !submitting && setLicenseModal(null)}>
          <div className="modal-content w-[560px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {editingLicense ? 'Gestionar licencia' : 'Nueva licencia'}
                </h3>
                <p className="text-sm text-neutral-500">
                  {editingLicense ? `${tenant.businessName} · ${editingLicense.planName}` : `Asigna un plan a ${tenant.businessName}`}
                </p>
              </div>
              <button onClick={() => setLicenseModal(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Plan */}
              <div>
                <label className="label">Plan *</label>
                <select value={selectedPlanId} onChange={e => setSelectedPlanId(Number(e.target.value))} className="input">
                  <option value={0}>Seleccionar plan...</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.priceMonthly)}/mes</option>)}
                </select>
              </div>

              {editingLicense ? (
                <>
                  {/* Tipo + Estado */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Tipo</label>
                      <select value={form.licenseType} onChange={e => update('licenseType', e.target.value)} className="input">
                        <option value="PAID">Paga</option>
                        <option value="TRIAL">Trial</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Estado</label>
                      <select value={form.status} onChange={e => update('status', e.target.value)} className="input">
                        {LICENSE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Inicio</label>
                      <input type="date" value={form.startsAt} onChange={e => update('startsAt', e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Vencimiento</label>
                      <input type="date" value={form.expiresAt} onChange={e => update('expiresAt', e.target.value)} className="input" />
                    </div>
                  </div>

                  {/* Auto-renew + Grace */}
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                      <input type="checkbox" checked={form.autoRenew} onChange={e => update('autoRenew', e.target.checked)} className="rounded" />
                      Renovación automática
                    </label>
                    <div>
                      <label className="label">Días de gracia</label>
                      <input type="number" value={form.gracePeriodDays} onChange={e => update('gracePeriodDays', Number(e.target.value))} className="input" min={0} />
                    </div>
                  </div>

                  {/* Descuento */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Descuento %</label>
                      <input type="number" value={form.discountPct} onChange={e => update('discountPct', Number(e.target.value))} className="input" min={0} max={100} />
                    </div>
                    <div>
                      <label className="label">Motivo descuento</label>
                      <input value={form.discountReason} onChange={e => update('discountReason', e.target.value)} className="input" placeholder="Opcional" />
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="label">Notas</label>
                    <textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="input h-20 resize-none" placeholder="Notas internas (opcional)" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Tipo</label>
                      <select value={form.licenseType} onChange={e => update('licenseType', e.target.value)} className="input">
                        <option value="PAID">Paga</option>
                        <option value="TRIAL">Trial</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Duración</label>
                      <select value={form.durationMonths} onChange={e => update('durationMonths', Number(e.target.value))} className="input">
                        {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <input type="checkbox" checked={form.autoRenew} onChange={e => update('autoRenew', e.target.checked)} className="rounded" />
                    Renovación automática
                  </label>
                  <div>
                    <label className="label">Notas</label>
                    <textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="input h-20 resize-none" placeholder="Notas internas (opcional)" />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex gap-2">
                {editingLicense && (
                  <>
                    <button onClick={handleRenewLicense} disabled={submitting}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
                      <RefreshCw className="w-4 h-4" /> Renovar +1 mes
                    </button>
                    <button onClick={handleDeleteLicense} disabled={submitting}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setLicenseModal(null)} className="btn-secondary" disabled={submitting}>Cancelar</button>
                <button
                  onClick={editingLicense ? handleUpdateLicense : handleCreateLicense}
                  disabled={submitting || !selectedPlanId}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {submitting ? 'Guardando...' : (editingLicense ? 'Guardar cambios' : 'Crear licencia')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: CAMBIAR PLAN ============ */}
      {licenseModal === 'plan' && (
        <div className="modal-overlay" onClick={() => !submitting && setLicenseModal(null)}>
          <div className="modal-content w-[520px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Cambiar plan</h3>
                <p className="text-sm text-neutral-500">
                  {editingLicense
                    ? `${tenant.businessName} · actual: ${editingLicense.planName}`
                    : `${tenant.businessName} no tiene licencia. Usa "Gestionar licencia".`}
                </p>
              </div>
              <button onClick={() => setLicenseModal(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingLicense ? (
              <>
                {/* Comparativa rápida */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-neutral-400 mb-2">Plan actual</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{editingLicense.planName}</span>
                    <span className="text-sm font-mono text-neutral-500">{formatCurrency(editingLicense.pricePaidMonthly)}/mes</span>
                  </div>
                </div>

                <div>
                  <label className="label">Nuevo plan *</label>
                  <select value={selectedPlanId} onChange={e => setSelectedPlanId(Number(e.target.value))} className="input">
                    <option value={0}>Seleccionar plan...</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id} disabled={p.id === editingLicense.planId}>
                        {p.name} — {formatCurrency(p.priceMonthly)}/mes{p.id === editingLicense.planId ? ' (actual)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPlanId > 0 && selectedPlanId !== editingLicense.planId && (
                  <div className="bg-warning-50 dark:bg-amber-900/20 rounded-xl p-3 border border-warning-200 dark:border-amber-800">
                    <p className="text-xs text-warning-700 dark:text-warning-400">
                      El cambio de plan actualiza el precio mensual de la licencia y queda registrado en el historial. El vencimiento no cambia.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <button onClick={() => setLicenseModal(null)} className="btn-secondary" disabled={submitting}>Cancelar</button>
                  <button onClick={handleChangePlan}
                    disabled={submitting || !selectedPlanId || selectedPlanId === editingLicense.planId}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {submitting ? 'Cambiando...' : 'Cambiar plan'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-neutral-400">
                <Ban className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
                <p className="text-sm">Esta empresa no tiene licencia asignada</p>
                <button onClick={openManageLicense} className="btn-primary text-sm mt-4">Crear licencia</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ MODAL: CAMBIAR ESTADO ============ */}
      {statusModal && (
        <div className="modal-overlay" onClick={() => !submitting && setStatusModal(false)}>
          <div className="modal-content w-[480px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Cambiar estado de la empresa</h3>
                <p className="text-sm text-neutral-500">{tenant.businessName} · estado actual: {statusLabel(tenant.status)}</p>
              </div>
              <button onClick={() => setStatusModal(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Nuevo estado *</label>
                <select value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))} className="input">
                  <option value="">Seleccionar...</option>
                  {TENANT_STATUSES.filter(s => s.value !== tenant.status).map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {(statusForm.status === 'SUSPENDED' || statusForm.status === 'CANCELLED') && (
                <div>
                  <label className="label">Motivo *</label>
                  <textarea value={statusForm.reason} onChange={e => setStatusForm(p => ({ ...p, reason: e.target.value }))}
                    className="input h-20 resize-none" placeholder="Ej: Mora en el pago de la licencia, solicitud del cliente..." />
                </div>
              )}

              {statusForm.status === 'ACTIVE' && (
                <div className="bg-success-50 dark:bg-green-900/20 rounded-xl p-3 border border-success-200 dark:border-green-800">
                  <p className="text-xs text-success-700 dark:text-success-400">
                    Al activar la empresa se registra la fecha de activación y se limpia el motivo de suspensión (si existía).
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button onClick={() => setStatusModal(false)} className="btn-secondary" disabled={submitting}>Cancelar</button>
              <button onClick={handleChangeStatus}
                disabled={submitting || !statusForm.status}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'Guardando...' : 'Cambiar estado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: USUARIO Y CONTRASEÑA DEL ADMIN ============ */}
      {accessModal && (
        <div className="modal-overlay" onClick={() => !submitting && setAccessModal(false)}>
          <div className="modal-content w-[560px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Usuario y contraseña del admin</h3>
                <p className="text-sm text-neutral-500">Acceso de {tenant.businessName} al panel cliente (app.escriba.co)</p>
              </div>
              <button onClick={() => setAccessModal(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Usuario admin actual */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                <p className="text-xs text-neutral-400 mb-2">Usuario administrador</p>
                {tenant.adminEmail ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{tenant.adminEmail}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {tenant.adminUserId
                          ? '✅ Usuario provisionado en el aplicativo de empresas'
                          : '⚠️ Sin usuario provisionado — se creará al asignar contraseña'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">No se ha definido un email de admin. Se usará {tenant.email}.</p>
                )}
              </div>

              {/* Usuarios de la empresa */}
              <div>
                <p className="text-xs text-neutral-400 mb-2">Usuarios del aplicativo de empresas ({users.length})</p>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-escriba-500" /></div>
                ) : users.length === 0 ? (
                  <p className="text-sm text-neutral-400 py-2">Sin usuarios registrados todavía.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {users.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{u.fullName || `${u.firstName} ${u.lastName}`}</p>
                          <p className="text-xs text-neutral-500">{u.email} · {u.roleName || u.roleCode || '—'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {u.mustChangePassword && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning-50 dark:bg-amber-900/20 text-warning-600 dark:text-warning-400">cambiar clave</span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.active ? 'bg-success-50 dark:bg-green-900/20 text-success-600 dark:text-success-400' : 'bg-neutral-100 text-neutral-500'}`}>
                            {u.active ? 'activo' : 'inactivo'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Asignar contraseña */}
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <p className="text-xs text-neutral-400 mb-2">Asignar / reasignar contraseña del admin</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={passwordForm.show ? 'text' : 'password'}
                      value={passwordForm.password}
                      onChange={e => setPasswordForm(p => ({ ...p, password: e.target.value }))}
                      className="input pr-10"
                      placeholder="Nueva contraseña (vacío = generar automática)"
                    />
                    <button
                      onClick={() => setPasswordForm(p => ({ ...p, show: !p.show }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 cursor-pointer">
                      {passwordForm.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={generatePassword} title="Generar contraseña aleatoria"
                    className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                    <Wand2 className="w-4 h-4" />
                  </button>
                </div>
                {tempPassword && (
                  <div className="bg-warning-50 dark:bg-amber-900/20 rounded-xl p-3 mt-3 border border-warning-200 dark:border-amber-800">
                    <p className="text-xs text-warning-700 dark:text-warning-400">
                      Contraseña temporal generada (el usuario deberá cambiarla al iniciar sesión):
                    </p>
                    <code className="block mt-1 text-sm font-mono font-bold text-warning-800 dark:text-warning-300">{tempPassword}</code>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button onClick={() => setAccessModal(false)} className="btn-secondary" disabled={submitting}>Cerrar</button>
              <button onClick={handleResetPassword} disabled={submitting}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'Guardando...' : 'Asignar contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: IMPERSONACIÓN ============ */}
      {showImpersonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowImpersonateModal(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-amber-900/20 flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Acceder al panel de {tenant.businessName}</h3>
                <p className="text-sm text-neutral-500">Estás a punto de ingresar como administrador del sistema</p>
              </div>
            </div>
            <div className="bg-warning-50 dark:bg-amber-900/20 rounded-xl p-3 mb-4 border border-warning-200 dark:border-amber-800">
              <p className="text-xs text-warning-700 dark:text-warning-400">
                ⚠️ Todas tus acciones serán registradas en auditoría. Esta sesión es temporal (2h) y no renovable.
              </p>
            </div>
            <div className="mb-4">
              <label className="label">Motivo de acceso *</label>
              <textarea value={impersonateReason} onChange={e => setImpersonateReason(e.target.value)}
                className="input h-20 resize-none" placeholder="Ej: Soporte técnico — Revisión de configuración DIAN" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowImpersonateModal(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleImpersonate} disabled={!impersonateReason.trim()}
                className="btn-primary disabled:opacity-50">Acceder al panel</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{value}</p>
    </div>
  )
}

function InfoCard({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      {badge ? (
        <span className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${badge}`}>{value}</span>
      ) : (
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5">{value}</p>
      )}
    </div>
  )
}
