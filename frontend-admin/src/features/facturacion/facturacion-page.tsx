import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, DollarSign, TrendingUp, AlertTriangle, Plus, X, Check, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { TenantInvoice, Tenant } from '@/types/admin'

export function FacturacionPage() {
  const [invoices, setInvoices] = useState<TenantInvoice[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<TenantInvoice | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Create form
  const [form, setForm] = useState({
    tenantId: '', concept: '', description: '', amountNet: 0,
    taxPct: 19, issueDate: new Date().toISOString().split('T')[0],
    dueDate: '', expectedPaymentMethod: '', notes: '', notifyTenant: true,
  })

  // Payment form
  const [payment, setPayment] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0, paymentMethod: 'TRANSFER', reference: '', notes: '',
  })

  const fetchInvoices = useCallback(() => {
    setLoading(true)
    api.get('/invoices')
      .then((r: any) => {
        const d = r?.data ?? r
        setInvoices(d?.content ?? d ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const update = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  const openCreateModal = () => {
    setShowCreateModal(true)
    setForm({ tenantId: '', concept: '', description: '', amountNet: 0, taxPct: 19, issueDate: new Date().toISOString().split('T')[0], dueDate: '', expectedPaymentMethod: '', notes: '', notifyTenant: true })
    api.get('/tenants', { page: '0', size: '200' }).then((r: any) => {
      const d = r?.data ?? r; setTenants(d?.content ?? d ?? [])
    }).catch(() => {})
  }

  const handleCreate = async () => {
    if (!form.tenantId || !form.concept || form.amountNet <= 0 || !form.dueDate) {
      alert('Completa todos los campos requeridos'); return
    }
    setSubmitting(true)
    try {
      await api.post('/invoices', form)
      alert('Factura creada exitosamente')
      setShowCreateModal(false)
      fetchInvoices()
    } catch (err: any) { alert(err?.message || 'Error') }
    finally { setSubmitting(false) }
  }

  const openPaymentModal = (inv: TenantInvoice) => {
    setSelectedInvoice(inv)
    setPayment({ paymentDate: new Date().toISOString().split('T')[0], amount: inv.total, paymentMethod: 'TRANSFER', reference: '', notes: '' })
    setShowPaymentModal(true)
  }

  const handlePayment = async () => {
    if (!selectedInvoice) return
    setSubmitting(true)
    try {
      await api.post('/invoices/register-payment', { ...payment, invoiceId: selectedInvoice.id })
      alert('Pago registrado exitosamente')
      setShowPaymentModal(false)
      fetchInvoices()
    } catch (err: any) { alert(err?.message || 'Error') }
    finally { setSubmitting(false) }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-warning-50 text-warning-600 dark:bg-amber-900/20 dark:text-amber-400',
      PAID: 'bg-success-50 text-success-600 dark:bg-green-900/20 dark:text-green-400',
      OVERDUE: 'bg-danger-50 text-danger-600 dark:bg-red-900/20 dark:text-red-400',
      CANCELLED: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    }
    return map[status] || 'bg-neutral-100 text-neutral-500'
  }

  const mrr = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total, 0)
  const overdue = invoices.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE').reduce((s, i) => s + i.total, 0)
  const collected = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.total, 0)
  const collectionRate = invoices.length > 0 ? Math.round((collected / (collected + overdue)) * 100) : 0

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Facturación y cobros</h1>
          <p className="text-sm text-neutral-500 mt-1">{invoices.length} facturas registradas</p>
        </div>
        <button onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-escriba-600 hover:bg-escriba-700 text-white text-sm font-medium transition-all cursor-pointer">
          <Plus className="w-4 h-4" /> Nueva factura
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'MRR', value: formatCurrency(mrr), icon: TrendingUp, color: 'bg-escriba-50 text-escriba-600' },
          { label: 'Cartera vencida', value: formatCurrency(overdue), icon: AlertTriangle, color: 'bg-danger-50 text-danger-600' },
          { label: 'Cobros totales', value: formatCurrency(collected), icon: DollarSign, color: 'bg-success-50 text-success-600' },
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

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-escriba-500" /></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 text-neutral-400">
            <p className="text-lg font-medium">Sin facturas</p>
            <p className="text-sm mt-1">Crea tu primera factura</p>
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
                <th className="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-3 text-sm font-mono text-neutral-600">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-neutral-900">{inv.tenantName}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600">{inv.concept}</td>
                  <td className="px-4 py-3 text-sm text-right font-mono text-neutral-800 dark:text-neutral-200">{formatCurrency(inv.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(inv.status)}`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3 text-right">
                    {inv.status === 'PENDING' && (
                      <button onClick={() => openPaymentModal(inv)} className="text-xs text-escriba-600 hover:underline font-medium cursor-pointer">
                        Registrar pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !submitting && setShowCreateModal(false)}>
          <div className="modal-content w-[520px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Nueva factura</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label">Empresa *</label>
                <select value={form.tenantId} onChange={e => update('tenantId', e.target.value)} className="input">
                  <option value="">Seleccionar...</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.businessName}</option>)}
                </select>
              </div>
              <div><label className="label">Concepto *</label>
                <input value={form.concept} onChange={e => update('concept', e.target.value)} className="input" placeholder="Ej: Factura mensual Julio 2026" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Monto neto *</label>
                  <input type="number" value={form.amountNet} onChange={e => update('amountNet', Number(e.target.value))} className="input" min={0} />
                </div>
                <div><label className="label">IVA %</label>
                  <input type="number" value={form.taxPct} onChange={e => update('taxPct', Number(e.target.value))} className="input" min={0} max={100} />
                </div>
              </div>
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
                  <option value="TRANSFER">Transferencia</option>
                  <option value="PSE">PSE</option>
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                </select>
              </div>
              <div><label className="label">Notas</label>
                <textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="input h-20 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary" disabled={submitting}>Cancelar</button>
              <button onClick={handleCreate} disabled={submitting} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'Creando...' : 'Crear factura'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => !submitting && setShowPaymentModal(false)}>
          <div className="modal-content w-[480px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold">Registrar pago</h3>
                <p className="text-sm text-neutral-500">{selectedInvoice.invoiceNumber} — {formatCurrency(selectedInvoice.total)}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label">Fecha de pago</label>
                <input type="date" value={payment.paymentDate} onChange={e => setPayment(p => ({ ...p, paymentDate: e.target.value }))} className="input" />
              </div>
              <div><label className="label">Monto</label>
                <input type="number" value={payment.amount} onChange={e => setPayment(p => ({ ...p, amount: Number(e.target.value) }))} className="input" min={0} />
              </div>
              <div><label className="label">Método de pago</label>
                <select value={payment.paymentMethod} onChange={e => setPayment(p => ({ ...p, paymentMethod: e.target.value }))} className="input">
                  <option value="TRANSFER">Transferencia</option>
                  <option value="PSE">PSE</option>
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                </select>
              </div>
              <div><label className="label">Referencia</label>
                <input value={payment.reference} onChange={e => setPayment(p => ({ ...p, reference: e.target.value }))} className="input" placeholder="N° de transacción" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button onClick={() => setShowPaymentModal(false)} className="btn-secondary" disabled={submitting}>Cancelar</button>
              <button onClick={handlePayment} disabled={submitting} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'Registrando...' : 'Registrar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
