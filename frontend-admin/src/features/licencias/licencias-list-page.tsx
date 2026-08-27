import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Loader2, X, Check, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { AdminRoleCode, License, Tenant, Plan } from '@/types/admin'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'Activas' },
  { value: 'TRIAL', label: 'Trial' },
  { value: 'EXPIRED', label: 'Vencidas' },
  { value: 'SUSPENDED', label: 'Suspendidas' },
  { value: 'CANCELLED', label: 'Canceladas' },
]

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

const EMPTY_FORM = {
  tenantId: '', planId: 0, licenseType: 'PAID', status: 'ACTIVE',
  startsAt: '', expiresAt: '', durationMonths: 12, autoRenew: true,
  gracePeriodDays: 7, discountPct: 0, discountReason: '', notes: '',
  notifyTenant: true,
}

function toDateInput(iso?: string): string {
  return iso ? iso.slice(0, 10) : ''
}

export function LicenciasListPage() {
  const { user } = useAdminAuthStore()
  const userRole = user?.role as AdminRoleCode
  const canWrite = userRole === 'SA' || userRole === 'AC' || userRole === 'AF'
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)

  // Modal state: null | 'create' | 'edit' | 'delete'
  const [modalMode, setModalMode] = useState<null | 'create' | 'edit' | 'delete'>(null)
  const [submitting, setSubmitting] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [editingLicense, setEditingLicense] = useState<License | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const update = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  const fetchLicenses = useCallback(() => {
    setLoading(true)
    api.get('/licenses', {
      status: statusFilter || undefined,
      page: String(page),
      size: '20',
    })
      .then((response: any) => {
        const data = response?.data ?? response
        setLicenses(data?.content ?? data ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [statusFilter, page])

  useEffect(() => { fetchLicenses() }, [fetchLicenses])

  // Cargar catálogos de empresas y planes una sola vez
  useEffect(() => {
    api.get('/tenants', { page: '0', size: '200' }).then((r: any) => {
      const d = r?.data ?? r; setTenants(d?.content ?? d ?? [])
    }).catch(() => {})
    api.get('/plans').then((r: any) => {
      const d = r?.data ?? r
      setPlans((Array.isArray(d) ? d : d?.content ?? []).filter((p: Plan) => p.status === 'ACTIVE'))
    }).catch(() => {})
  }, [])

  const openCreate = () => {
    setEditingLicense(null)
    setForm({ ...EMPTY_FORM })
    setModalMode('create')
  }

  const openEdit = (lic: License) => {
    setEditingLicense(lic)
    setForm({
      tenantId: lic.tenantId,
      planId: lic.planId,
      licenseType: lic.licenseType,
      status: lic.status,
      startsAt: toDateInput(lic.startsAt),
      expiresAt: toDateInput(lic.expiresAt),
      durationMonths: 12,
      autoRenew: lic.autoRenew,
      gracePeriodDays: lic.gracePeriodDays,
      discountPct: lic.discountPct ?? 0,
      discountReason: lic.discountReason ?? '',
      notes: lic.notes ?? '',
      notifyTenant: true,
    })
    setModalMode('edit')
  }

  const handleCreate = async () => {
    if (!form.tenantId || !form.planId) { alert('Selecciona empresa y plan'); return }
    setSubmitting(true)
    try {
      const startDate = new Date().toISOString().split('T')[0]
      await api.post('/licenses', {
        tenantId: form.tenantId,
        planId: Number(form.planId),
        licenseType: form.licenseType,
        startDate,
        durationMonths: Number(form.durationMonths),
        autoRenew: form.autoRenew,
        gracePeriodDays: Number(form.gracePeriodDays),
        discountPct: Number(form.discountPct) || 0,
        discountReason: form.discountReason,
        notes: form.notes,
        notifyTenant: form.notifyTenant,
      })
      alert('Licencia creada exitosamente')
      setModalMode(null)
      fetchLicenses()
    } catch (err: any) {
      alert(err?.message || 'Error al crear licencia')
    } finally { setSubmitting(false) }
  }

  const handleUpdate = async () => {
    if (!editingLicense) return
    setSubmitting(true)
    try {
      await api.put(`/licenses/${editingLicense.id}`, {
        planId: Number(form.planId),
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
      setModalMode(null)
      fetchLicenses()
    } catch (err: any) {
      alert(err?.message || 'Error al actualizar licencia')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!editingLicense) return
    setSubmitting(true)
    try {
      await api.delete(`/licenses/${editingLicense.id}`)
      alert('Licencia eliminada')
      setModalMode(null)
      setEditingLicense(null)
      fetchLicenses()
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar licencia')
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

  const statusLabel = (s: string) =>
    LICENSE_STATUSES.find(o => o.value === s)?.label ?? s

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Licencias</h1>
          <p className="text-sm text-neutral-500 mt-1">Gestión de licencias de empresas · {licenses.length} registros</p>
        </div>
        {canWrite && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-escriba-600 hover:bg-escriba-700 text-white text-sm font-medium transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> Nueva licencia
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }} className="input w-40">
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-escriba-500" /></div>
        ) : licenses.length === 0 ? (
          <div className="text-center py-16 text-neutral-400">
            <p className="text-lg font-medium">Sin licencias</p>
            <p className="text-sm mt-1">No hay licencias con los filtros actuales</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Empresa</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Plan</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Estado</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Inicio</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Vencimiento</th>
                <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Precio</th>
                {canWrite && (
                  <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {licenses.map((lic) => (
                <tr key={lic.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">{lic.tenantName}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">{lic.planName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(lic.status)}`}>{statusLabel(lic.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(lic.startsAt)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(lic.expiresAt)}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-neutral-600 dark:text-neutral-400">
                    {formatCurrency(lic.pricePaidMonthly)}/mes
                    {lic.discountPct > 0 && <span className="text-xs text-success-500 ml-1">-{lic.discountPct}%</span>}
                  </td>
                  {canWrite && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(lic)} title="Editar licencia"
                          className="p-2 rounded-lg hover:bg-escriba-50 dark:hover:bg-escriba-900/20 text-escriba-600 dark:text-escriba-400 transition-colors cursor-pointer">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingLicense(lic); setModalMode('delete') }} title="Eliminar licencia"
                          className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-red-900/20 text-danger-600 dark:text-danger-400 transition-colors cursor-pointer">
                          <Trash2 className="w-4 h-4" />
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

      {/* ============ MODAL: CREAR ============ */}
      {modalMode === 'create' && (
        <div className="modal-overlay" onClick={() => !submitting && setModalMode(null)}>
          <div className="modal-content w-[520px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Nueva licencia</h3>
                <p className="text-sm text-neutral-500">Asigna un plan a una empresa</p>
              </div>
              <button onClick={() => setModalMode(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Empresa *</label>
                <select value={form.tenantId} onChange={e => update('tenantId', e.target.value)} className="input">
                  <option value="">Seleccionar empresa...</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.businessName} ({t.nit})</option>)}
                </select>
              </div>

              <div>
                <label className="label">Plan *</label>
                <select value={form.planId} onChange={e => update('planId', Number(e.target.value))} className="input">
                  <option value={0}>Seleccionar plan...</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.priceMonthly)}/mes</option>)}
                </select>
              </div>

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

              <div>
                <label className="label">Notas</label>
                <textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="input h-20 resize-none" placeholder="Notas internas (opcional)" />
              </div>

              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input type="checkbox" checked={form.notifyTenant} onChange={e => update('notifyTenant', e.target.checked)} className="rounded" />
                Notificar a la empresa
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button onClick={() => setModalMode(null)} className="btn-secondary" disabled={submitting}>Cancelar</button>
              <button onClick={handleCreate} disabled={submitting || !form.tenantId || !form.planId}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'Creando...' : 'Crear licencia'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: EDITAR ============ */}
      {modalMode === 'edit' && editingLicense && (
        <div className="modal-overlay" onClick={() => !submitting && setModalMode(null)}>
          <div className="modal-content w-[560px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Editar licencia</h3>
                <p className="text-sm text-neutral-500">
                  {editingLicense.tenantName} · {editingLicense.planName}
                </p>
              </div>
              <button onClick={() => setModalMode(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Empresa (solo lectura) */}
              <div>
                <label className="label">Empresa</label>
                <input value={editingLicense.tenantName} disabled className="input opacity-60" />
              </div>

              {/* Plan */}
              <div>
                <label className="label">Plan *</label>
                <select value={form.planId} onChange={e => update('planId', Number(e.target.value))} className="input">
                  <option value={0}>Seleccionar plan...</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.priceMonthly)}/mes</option>)}
                </select>
              </div>

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
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button onClick={() => setModalMode(null)} className="btn-secondary" disabled={submitting}>Cancelar</button>
              <button onClick={handleUpdate} disabled={submitting || !form.planId}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: ELIMINAR ============ */}
      {modalMode === 'delete' && editingLicense && (
        <div className="modal-overlay" onClick={() => !submitting && setModalMode(null)}>
          <div className="modal-content w-[440px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-danger-50 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-danger-600 dark:text-danger-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Eliminar licencia</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  ¿Seguro que deseas eliminar la licencia de{' '}
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{editingLicense.tenantName}</span>{' '}
                  (plan {editingLicense.planName})? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="bg-warning-50 dark:bg-amber-900/20 rounded-xl p-3 mb-4 border border-warning-200 dark:border-amber-800">
              <p className="text-xs text-warning-700 dark:text-warning-400">
                Las facturas asociadas se desvincularán de la licencia y su historial se eliminará.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setModalMode(null)} className="btn-secondary" disabled={submitting}>Cancelar</button>
              <button onClick={handleDelete} disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {submitting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
