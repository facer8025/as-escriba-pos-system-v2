import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, DollarSign, TrendingUp, AlertTriangle, Plus, X, Check, Loader2, Eye, Pencil, Trash2, Wallet } from 'lucide-react'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { AdminRoleCode, TenantInvoice, Tenant } from '@/types/admin'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'OVERDUE', label: 'Vencidas' },
  { value: 'PAID', label: 'Pagadas' },
  { value: 'CANCELLED', label: 'Canceladas' },
]

const INVOICE_STATUSES = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'OVERDUE', label: 'Vencida' },
  { value: 'PAID', label: 'Pagada' },
  { value: 'PARTIALLY_PAID', label: 'Parcialmente pagada' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

const PAYMENT_METHODS = [
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'PSE', label: 'PSE' },
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta' },
]

const EMPTY_FORM = {
  tenantId: '', concept: '', description: '', amountNet: 0,
  taxPct: 19, issueDate: new Date().toISOString().split('T')[0],
  dueDate: '', expectedPaymentMethod: '', notes: '', notifyTenant: true,
}

function toDateInput(iso?: string): string {
  return iso ? iso.slice(0, 10) : ''
}

export function FacturacionPage() {
  const { user } = useAdminAuthStore()
  const userRole = user?.role as AdminRoleCode
  const canWrite = userRole === 'SA' || userRole === 'AF'

  const [invoices, setInvoices] = useState<TenantInvoice[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Modal state
  const [modalMode, setModalMode] = useState<null | 'create' | 'edit' | 'payment' | 'detail' | 'cancel'>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<TenantInvoice | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [payment, setPayment] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0, paymentMethod: 'TRANSFER', reference: '', notes: '',
  })

  const update = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  const fetchInvoices = useCallback(() => {
    setLoading(true)
    api.get('/invoices', {
      status: statusFilter || undefined,
      page: String(page),
      size: '20',
    })
      .then((r: any) => {
        const d = r?.data ?? r
        setInvoices(d?.content ?? d ?? [])
        setTotalPages(d?.totalPages ?? 1)
        setLoading(false)
      })
      .catch(() => { setInvoices([]); setLoading(false) })
  }, [statusFilter, page])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  // Reset page on filter change
  useEffect(() => { setPage(0) }, [statusFilter])

  // Load tenants catalog once
  useEffect(() => {
    api.get('/tenants', { page: '0', size: '200' }).then((r: any) => {
      const d = r?.data ?? r
      setTenants(d?.content ?? d ?? [])
    }).catch(() => {})
  }, [])

  const openCreate = () => {
    setForm({ ...EMPTY_FORM })
    setModalMode('create')
  }

  const openEdit = (inv: TenantInvoice) => {
    setSelectedInvoice(inv)
    setForm({
      tenantId: inv.tenantId,
      concept: inv.concept,
      description: (inv as any).description ?? '',
      amountNet: Number(inv.amountNet),
      taxPct: Number(inv.taxPct),
      issueDate: toDateInput(inv.issuedAt),
      dueDate: toDateInput(inv.dueDate),
      expectedPaymentMethod: inv.paymentMethod ?? '',
      notes: (inv as any).notes ?? '',
      notifyTenant: true,
    })
    setModalMode('edit')
  }

  const openPayment = (inv: TenantInvoice) => {
    setSelectedInvoice(inv)
    setPayment({
      paymentDate: new Date().toISOString().split('T')[0],
      amount: Number(inv.total),
      paymentMethod: 'TRANSFER',
      reference: '',
      notes: '',
    })
    setModalMode('payment')
  }

  const handleCreate = async () => {
    if (!form.tenantId || !form.concept || form.amountNet <= 0 || !form.dueDate) {
      alert('Completa todos los campos requeridos'); return
    }
    setSubmitting(true)
    try {
      await api.post('/invoices', form)
      alert('Factura creada exitosamente')
      setModalMode(null)
      fetchInvoices()
    } catch (err: any) { alert(err?.message || 'Error al crear factura') }
    finally { setSubmitting(false) }
  }

  const handleUpdate = async () => {
    if (!selectedInvoice) return
    setSubmitting(true)
    try {
      await api.put(`/invoices/${selectedInvoice.id}`, {
        concept: form.concept,
        description: form.description,
        amountNet: Number(form.amountNet),
        taxPct: Number(form.taxPct),
        issueDate: form.issueDate || undefined,
        dueDate: form.dueDate || undefined,
        expectedPaymentMethod: form.expectedPaymentMethod,
        notes: form.notes,
      })
      alert('Factura actualizada exitosamente')
      setModalMode(null)
      fetchInvoices()
    } catch (err: any) { alert(err?.message || 'Error al actualizar factura') }
    finally { setSubmitting(false) }
  }

  const handlePayment = async () => {
    if (!selectedInvoice) return
    setSubmitting(true)
    try {
      await api.post('/invoices/register-payment', {
        invoiceId: selectedInvoice.id,
        paymentDate: payment.paymentDate,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        reference: payment.reference,
        notes: payment.notes,
      })
      alert('Pago registrado exitosamente')
      setModalMode(null)
      fetchInvoices()
    } catch (err: any) { alert(err?.message || 'Error al registrar pago') }
    finally { setSubmitting(false) }
  }

  const handleCancel = async () => {
    if (!selectedInvoice) return
    setSubmitting(true)
    try {
      await api.post(`/invoices/${selectedInvoice.id}/cancel`)
      alert('Factura cancelada')
      setModalMode(null)
      fetchInvoices()
    } catch (err: any) { alert(err?.message || 'Error al cancelar factura') }
    finally { setSubmitting(false) }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-warning-50 text-warning-600 dark:bg-amber-900/20 dark:text-amber-400',
      OVERDUE: 'bg-danger-50 text-danger-600 dark:bg-red-900/20 dark:text-red-400',
      PAID: 'bg-success-50 text-success-600 dark:bg-green-900/20 dark:text-green-400',
      PARTIALLY_PAID: 'bg-info-50 text-info-600 dark:bg-blue-900/20 dark:text-blue-400',
      CANCELLED: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    }
    return map[status] || 'bg-neutral-100 text-neutral-500'
  }

  const statusLabel = (s: string) => INVOICE_STATUSES.find(o => o.value === s)?.label ?? s

  // Muestra OVERDUE si la factura está pendiente y venció
  const displayStatus = (inv: TenantInvoice): string => {
    if (inv.status === 'PENDING' && inv.dueDate && inv.dueDate < new Date().toISOString().split('T')[0]) {
      return 'OVERDUE'
    }
    return inv.status
  }

  const editable = (inv: TenantInvoice) => inv.status === 'PENDING' || inv.status === 'OVERDUE'
  const today = new Date().toISOString().split('T')[0]

  // Stats
  const paidTotal = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + Number(i.total), 0)
  const overdueTotal = invoices.filter(i => displayStatus(i) === 'OVERDUE').reduce((s, i) => s + Number(i.total), 0)
  const pendingTotal = invoices.filter(i => displayStatus(i) === 'PENDING').reduce((s, i) => s + Number(i.total), 0)
  const receivables = overdueTotal + pendingTotal
  const collectionRate = (paidTotal + receivables) > 0 ? Math.round((paidTotal / (paidTotal + receivables)) * 100) : 0

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Facturación y cobros</h1>
          <p className="text-sm text-neutral-500 mt-1">{invoices.length} facturas en esta vista</p>
        </div>
        {canWrite && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-escriba-600 hover:bg-escriba-700 text-white text-sm font-medium transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> Nueva factura
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total cobrado', value: formatCurrency(paidTotal), icon: DollarSign, color: 'bg-success-50 text-success-600' },
          { label: 'Cartera vencida', value: formatCurrency(overdueTotal), icon: AlertTriangle, color: 'bg-danger-50 text-danger-600' },
          { label: 'Pendiente por vencer', value: formatCurrency(pendingTotal), icon: Wallet, color: 'bg-warning-50 text-warning-600' },
          { label: 'Tasa de cobro', value: collectionRate + '%', icon: CreditCard, color: 'bg-info-50 text-info-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-medium text-neutral-500">{stat.label}</h3>
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-44">
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-escriba-500" /></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 text-neutral-400">
            <p className="text-lg font-medium">Sin facturas</p>
            <p className="text-sm mt-1">No hay facturas con los filtros actuales</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3"># Factura</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Empresa</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Concepto</th>
                <th className="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Total</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Estado</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Vencimiento</th>
                <th className="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const status = displayStatus(inv)
                return (
                  <tr key={inv.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-3 text-sm font-mono text-neutral-600 dark:text-neutral-400">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100">{inv.tenantName}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">{inv.concept}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-neutral-800 dark:text-neutral-200">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(status)}`}>{statusLabel(status)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500">
                      {formatDate(inv.dueDate)}
                      {status === 'OVERDUE' && <span className="text-xs text-danger-500 ml-1">({Math.max(0, Math.round((new Date(today).getTime() - new Date(toDateInput(inv.dueDate)).getTime()) / 86400000))}d)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelectedInvoice(inv); setModalMode('detail') }} title="Ver detalle"
                          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors cursor-pointer">
                          <Eye className="w-4 h-4" />
                        </button>
                        {canWrite && editable(inv) && (
                          <>
                            <button onClick={() => openPayment(inv)} title="Registrar pago"
                              className="p-2 rounded-lg hover:bg-success-50 dark:hover:bg-green-900/20 text-success-600 transition-colors cursor-pointer">
                              <CreditCard className="w-4 h-4" />
                            </button>
                            <button onClick={() => openEdit(inv)} title="Editar factura"
                              className="p-2 rounded-lg hover:bg-escriba-50 dark:hover:bg-escriba-900/20 text-escriba-600 dark:text-escriba-400 transition-colors cursor-pointer">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setSelectedInvoice(inv); setModalMode('cancel') }} title="Cancelar factura"
                              className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-red-900/20 text-danger-600 dark:text-danger-400 transition-colors cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {canWrite && inv.status === 'PENDING' && (
                          <button onClick={() => openPayment(inv)} className="text-xs text-escriba-600 dark:text-escriba-400 hover:underline font-medium cursor-pointer ml-1">
                            Registrar pago
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-secondary text-sm disabled:opacity-50">Anterior</button>
          <span className="flex items-center text-sm text-neutral-500 px-3">Página {page + 1} de {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="btn-secondary text-sm disabled:opacity-50">Siguiente</button>
        </div>
      )}

      {/* ============ MODAL: CREAR ============ */}
      {modalMode === 'create' && (
        <div className="modal-overlay" onClick={() => !submitting && setModalMode(null)}>
          <div className="modal-content w-[520px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Nueva factura</h3>
                <p className="text-sm text-neutral-500">Factura manual para una empresa</p>
              </div>
              <button onClick={() => setModalMode(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label">Empresa *</label>
                <select value={form.tenantId} onChange={e => update('tenantId', e.target.value)} className="input">
                  <option value="">Seleccionar...</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.businessName} ({t.nit})</option>)}
                </select>
              </div>
              <div><label className="label">Concepto *</label>
                <input value={form.concept} onChange={e => update('concept', e.target.value)} className="input" placeholder="Ej: Factura mensual Julio 2026" />
              </div>
              <div><label className="label">Descripción</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)} className="input h-16 resize-none" placeholder="Detalle adicional (opcional)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Monto neto *</label>
                  <input type="number" value={form.amountNet} onChange={e => update('amountNet', Number(e.target.value))} className="input" min={0} />
                </div>
                <div><label className="label">IVA %</label>
                  <input type="number" value={form.taxPct} onChange={e => update('taxPct', Number(e.target.value))} className="input" min={0} max={100} />
                </div>
              </div>
              {form.amountNet > 0 && (
                <p className="text-sm text-neutral-500">
                  Total: <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                    {formatCurrency(form.amountNet + (form.amountNet * form.taxPct) / 100)}
                  </span> (IVA {formatCurrency((form.amountNet * form.taxPct) / 100)})
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Fecha de emisión</label>
                  <input type="date" value={form.issueDate} onChange={e => update('issueDate', e.target.value)} className="input" />
                </div>
                <div><label className="label">Fecha de vencimiento *</label>
                  <input type="date" value={form.dueDate} onChange={e => update('dueDate', e.target.value)} className="input" />
                </div>
              </div>
              <div><label className="label">Método de pago esperado</label>
                <select value={form.expectedPaymentMethod} onChange={e => update('expectedPaymentMethod', e.target.value)} className="input">
                  <option value="">—</option>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div><label className="label">Notas</label>
                <textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="input h-16 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button onClick={() => setModalMode(null)} className="btn-secondary" disabled={submitting}>Cancelar</button>
              <button onClick={handleCreate} disabled={submitting} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'Creando...' : 'Crear factura'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: EDITAR ============ */}
      {modalMode === 'edit' && selectedInvoice && (
        <div className="modal-overlay" onClick={() => !submitting && setModalMode(null)}>
          <div className="modal-content w-[520px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Editar factura</h3>
                <p className="text-sm text-neutral-500">{selectedInvoice.invoiceNumber} — {selectedInvoice.tenantName}</p>
              </div>
              <button onClick={() => setModalMode(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label">Concepto *</label>
                <input value={form.concept} onChange={e => update('concept', e.target.value)} className="input" />
              </div>
              <div><label className="label">Descripción</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)} className="input h-16 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Monto neto *</label>
                  <input type="number" value={form.amountNet} onChange={e => update('amountNet', Number(e.target.value))} className="input" min={0} />
                </div>
                <div><label className="label">IVA %</label>
                  <input type="number" value={form.taxPct} onChange={e => update('taxPct', Number(e.target.value))} className="input" min={0} max={100} />
                </div>
              </div>
              {form.amountNet > 0 && (
                <p className="text-sm text-neutral-500">
                  Total: <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                    {formatCurrency(form.amountNet + (form.amountNet * form.taxPct) / 100)}
                  </span>
                </p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Fecha de emisión</label>
                  <input type="date" value={form.issueDate} onChange={e => update('issueDate', e.target.value)} className="input" />
                </div>
                <div><label className="label">Fecha de vencimiento *</label>
                  <input type="date" value={form.dueDate} onChange={e => update('dueDate', e.target.value)} className="input" />
                </div>
              </div>
              <div><label className="label">Método de pago esperado</label>
                <select value={form.expectedPaymentMethod} onChange={e => update('expectedPaymentMethod', e.target.value)} className="input">
                  <option value="">—</option>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div><label className="label">Notas</label>
                <textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="input h-16 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button onClick={() => setModalMode(null)} className="btn-secondary" disabled={submitting}>Cancelar</button>
              <button onClick={handleUpdate} disabled={submitting} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: REGISTRAR PAGO ============ */}
      {modalMode === 'payment' && selectedInvoice && (
        <div className="modal-overlay" onClick={() => !submitting && setModalMode(null)}>
          <div className="modal-content w-[480px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Registrar pago</h3>
                <p className="text-sm text-neutral-500">{selectedInvoice.invoiceNumber} — {selectedInvoice.tenantName}</p>
              </div>
              <button onClick={() => setModalMode(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-neutral-500">Total factura</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(selectedInvoice.total)}</span>
              </div>
              <div><label className="label">Fecha de pago</label>
                <input type="date" value={payment.paymentDate} onChange={e => setPayment(p => ({ ...p, paymentDate: e.target.value }))} className="input" />
              </div>
              <div><label className="label">Monto</label>
                <input type="number" value={payment.amount} onChange={e => setPayment(p => ({ ...p, amount: Number(e.target.value) }))} className="input" min={0} />
              </div>
              <div><label className="label">Método de pago</label>
                <select value={payment.paymentMethod} onChange={e => setPayment(p => ({ ...p, paymentMethod: e.target.value }))} className="input">
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div><label className="label">Referencia</label>
                <input value={payment.reference} onChange={e => setPayment(p => ({ ...p, reference: e.target.value }))} className="input" placeholder="N° de transacción" />
              </div>
              <div><label className="label">Notas</label>
                <textarea value={payment.notes} onChange={e => setPayment(p => ({ ...p, notes: e.target.value }))} className="input h-16 resize-none" placeholder="Opcional" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button onClick={() => setModalMode(null)} className="btn-secondary" disabled={submitting}>Cancelar</button>
              <button onClick={handlePayment} disabled={submitting || payment.amount <= 0} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'Registrando...' : 'Registrar pago'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: DETALLE ============ */}
      {modalMode === 'detail' && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setModalMode(null)}>
          <div className="modal-content w-[520px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Detalle de factura</h3>
                <p className="text-sm font-mono text-neutral-500">{selectedInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setModalMode(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{selectedInvoice.tenantName}</p>
                  <p className="text-sm text-neutral-500">{selectedInvoice.concept}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(displayStatus(selectedInvoice))}`}>
                  {statusLabel(displayStatus(selectedInvoice))}
                </span>
              </div>

              {(selectedInvoice as any).description && (
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3">
                  <p className="text-xs text-neutral-400 mb-1">Descripción</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">{(selectedInvoice as any).description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-neutral-400">Monto neto</p>
                  <p className="font-mono font-medium">{formatCurrency(selectedInvoice.amountNet)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">IVA ({selectedInvoice.taxPct}%)</p>
                  <p className="font-mono font-medium">{formatCurrency(selectedInvoice.taxAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Total</p>
                  <p className="font-mono font-bold text-lg">{formatCurrency(selectedInvoice.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Emisión</p>
                  <p className="font-medium">{formatDate(selectedInvoice.issuedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Vencimiento</p>
                  <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Fecha de pago</p>
                  <p className="font-medium">{selectedInvoice.paidAt ? formatDate(selectedInvoice.paidAt) : '—'}</p>
                </div>
              </div>

              {selectedInvoice.status === 'PAID' && (
                <div className="bg-success-50 dark:bg-green-900/20 rounded-xl p-3 border border-success-200 dark:border-green-800">
                  <p className="text-xs text-success-600 dark:text-success-400 font-medium mb-1">Información del pago</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-xs text-neutral-400">Método</p><p className="font-medium">{PAYMENT_METHODS.find(m => m.value === selectedInvoice.paymentMethod)?.label ?? selectedInvoice.paymentMethod ?? '—'}</p></div>
                    <div><p className="text-xs text-neutral-400">Referencia</p><p className="font-mono">{selectedInvoice.paymentReference || '—'}</p></div>
                  </div>
                </div>
              )}

              {(selectedInvoice as any).notes && (
                <div>
                  <p className="text-xs text-neutral-400 mb-1">Notas</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">{(selectedInvoice as any).notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              {canWrite && editable(selectedInvoice) && (
                <button onClick={() => openPayment(selectedInvoice)} className="btn-primary flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Registrar pago
                </button>
              )}
              <button onClick={() => setModalMode(null)} className="btn-secondary">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: CANCELAR ============ */}
      {modalMode === 'cancel' && selectedInvoice && (
        <div className="modal-overlay" onClick={() => !submitting && setModalMode(null)}>
          <div className="modal-content w-[440px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-danger-50 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-danger-600 dark:text-danger-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Cancelar factura</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  ¿Seguro que deseas cancelar la factura{' '}
                  <span className="font-mono font-medium text-neutral-700 dark:text-neutral-300">{selectedInvoice.invoiceNumber}</span>{' '}
                  de {selectedInvoice.tenantName} por {formatCurrency(selectedInvoice.total)}?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setModalMode(null)} className="btn-secondary" disabled={submitting}>No, mantener</button>
              <button onClick={handleCancel} disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {submitting ? 'Cancelando...' : 'Sí, cancelar factura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
