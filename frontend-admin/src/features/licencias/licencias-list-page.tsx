import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, Loader2, X, Check } from 'lucide-react'
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
]

const DURATIONS = [
  { value: 1, label: '1 mes' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '1 año' },
  { value: 24, label: '2 años' },
]

export function LicenciasListPage() {
  const { user } = useAdminAuthStore()
  const userRole = user?.role as AdminRoleCode
  const canWrite = userRole === 'SA' || userRole === 'AC' || userRole === 'AF'
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [form, setForm] = useState({
    tenantId: '', planId: 0, licenseType: 'PAID',
    durationMonths: 12, autoRenew: true, gracePeriodDays: 7,
    discountPct: 0, discountReason: '', notes: '', notifyTenant: true,
  })

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

  const openModal = () => {
    setShowModal(true)
    setForm({ tenantId: '', planId: 0, licenseType: 'PAID', durationMonths: 12, autoRenew: true, gracePeriodDays: 7, discountPct: 0, discountReason: '', notes: '', notifyTenant: true })
    // Load tenants and plans for selectors
    api.get('/tenants', { page: '0', size: '200' }).then((r: any) => {
      const d = r?.data ?? r; setTenants(d?.content ?? d ?? [])
    }).catch(() => {})
    api.get('/plans').then((r: any) => {
      const d = r?.data ?? r; setPlans(Array.isArray(d) ? d : [])
    }).catch(() => {})
  }

  const handleCreate = async () => {
    if (!form.tenantId || !form.planId) { alert('Selecciona empresa y plan'); return }
    setSubmitting(true)
    try {
      const startDate = new Date().toISOString().split('T')[0]
      await api.post('/licenses', { ...form, planId: Number(form.planId), startDate })
      alert('Licencia creada exitosamente')
      setShowModal(false)
      fetchLicenses()
    } catch (err: any) {
      alert(err?.message || 'Error al crear licencia')
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Licencias</h1>
          <p className="text-sm text-neutral-500 mt-1">Gestión de licencias de empresas · {licenses.length} registros</p>
        </div>
        {canWrite && (
          <button onClick={openModal}
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
              </tr>
            </thead>
            <tbody>
              {licenses.map((lic) => (
                <tr key={lic.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">{lic.tenantName}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">{lic.planName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(lic.status)}`}>{lic.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(lic.startsAt)}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(lic.expiresAt)}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-neutral-600 dark:text-neutral-400">
                    {formatCurrency(lic.pricePaidMonthly)}/mes
                    {lic.discountPct > 0 && <span className="text-xs text-success-500 ml-1">-{lic.discountPct}%</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create License Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal-content w-[520px] p-6" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Nueva licencia</h3>
                <p className="text-sm text-neutral-500">Asigna un plan a una empresa</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Tenant */}
              <div>
                <label className="label">Empresa *</label>
                <select value={form.tenantId} onChange={e => update('tenantId', e.target.value)} className="input">
                  <option value="">Seleccionar empresa...</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.businessName} ({t.nit})</option>)}
                </select>
              </div>

              {/* Plan */}
              <div>
                <label className="label">Plan *</label>
                <select value={form.planId} onChange={e => update('planId', Number(e.target.value))} className="input">
                  <option value={0}>Seleccionar plan...</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.priceMonthly)}/mes</option>)}
                </select>
              </div>

              {/* Type + Duration */}
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

              {/* Discount */}
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

              {/* Notes */}
              <div>
                <label className="label">Notas</label>
                <textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="input h-20 resize-none" placeholder="Notas internas (opcional)" />
              </div>

              {/* Notify */}
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input type="checkbox" checked={form.notifyTenant} onChange={e => update('notifyTenant', e.target.checked)} className="rounded" />
                Notificar a la empresa
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button onClick={() => setShowModal(false)} className="btn-secondary" disabled={submitting}>Cancelar</button>
              <button onClick={handleCreate} disabled={submitting || !form.tenantId || !form.planId}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'Creando...' : 'Crear licencia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
