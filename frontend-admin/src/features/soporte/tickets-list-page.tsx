import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, Loader2, Search, Filter, ArrowUpDown,
  MessageSquare, Clock, AlertTriangle, UserCheck,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { SupportTicket, TicketStatsResponse } from '@/types/admin'
import { Modal } from '@/components/ui/modal'

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400',
  HIGH: 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
  MEDIUM: 'bg-info-50 text-info-600 dark:bg-blue-900/20 dark:text-blue-400',
  LOW: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  IN_PROGRESS: 'bg-escriba-50 text-escriba-600 dark:bg-escriba-900/20 dark:text-escriba-400',
  WAITING_CUSTOMER: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  CLOSED: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  WAITING_CUSTOMER: 'Esperando cliente',
  CLOSED: 'Cerrado',
}

const CATEGORY_LABELS: Record<string, string> = {
  BILLING: 'Facturación',
  DIAN: 'DIAN',
  POS: 'Punto de Venta',
  INVENTORY: 'Inventario',
  TECHNICAL: 'Técnico',
  COMMERCIAL: 'Comercial',
}

export function TicketsListPage() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<TicketStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [tenants, setTenants] = useState<{ id: string; businessName: string }[]>([])

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page: String(page), size: '25' }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      if (categoryFilter) params.category = categoryFilter

      const [ticketsRes, statsRes]: any[] = await Promise.all([
        api.get('/tickets', params),
        api.get('/tickets/stats'),
      ])

      const td = ticketsRes?.data ?? ticketsRes
      setTickets(td?.content ?? td ?? [])
      setTotalPages(td?.totalPages ?? 0)

      const sd = statsRes?.data ?? statsRes
      setStats(sd)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [page, search, statusFilter, priorityFilter, categoryFilter])

  useEffect(() => { loadTickets() }, [loadTickets])

  useEffect(() => {
    api.get('/tenants', { page: '0', size: '200' }).then((r: any) => {
      const d = r?.data ?? r
      setTenants(d?.content ?? d ?? [])
    }).catch(() => {})
  }, [])

  // Quick filter tabs
  const quickFilters = [
    { label: 'Todos', status: '' },
    { label: 'Abiertos', status: 'OPEN' },
    { label: 'En progreso', status: 'IN_PROGRESS' },
    { label: 'Críticos', priority: 'CRITICAL' },
    { label: 'Sin SLA', hasSla: true },
  ]

  const timeAgo = (dateStr: string | Date) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Soporte y tickets</h1>
          <p className="text-sm text-neutral-500 mt-1">Bandeja de tickets de soporte técnico</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-escriba-600 hover:bg-escriba-700 text-white text-sm font-medium transition-all cursor-pointer">
          <Plus className="w-4 h-4" />
          Nuevo ticket
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard label="Abiertos" value={stats.openTickets} color="text-neutral-600" />
          <StatCard label="En progreso" value={stats.inProgressTickets} color="text-escriba-600" />
          <StatCard label="Esperando" value={stats.waitingCustomerTickets} color="text-amber-600" />
          <StatCard label="Cerrados hoy" value={stats.closedToday} color="text-green-600" />
          <StatCard label="SLA vencido" value={stats.slaBreached} color="text-danger-600" />
          <StatCard label="Críticos" value={stats.criticalOpen} color="text-danger-600" />
          <StatCard label="Alta prioridad" value={stats.highOpen} color="text-warning-600" />
          <StatCard label="Prom. resolución" value={`${stats.avgResolutionHours}h`} color="text-info-600" />
        </div>
      )}

      {/* Quick filters */}
      <div className="flex gap-2 flex-wrap">
        {quickFilters.map((f) => (
          <button key={f.label}
            onClick={() => {
              setStatusFilter(f.status || '')
              setPriorityFilter((f as any).priority || '')
              setPage(0)
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              (f.status ? statusFilter === f.status : f.label === 'Todos' && !statusFilter && !priorityFilter)
                ? 'bg-escriba-600 text-white'
                : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Buscar por asunto o # de ticket..."
            className="input pl-9 w-full"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
          className="input min-w-[130px]">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(0) }}
          className="input min-w-[120px]">
          <option value="">Todas</option>
          <option value="CRITICAL">Crítica</option>
          <option value="HIGH">Alta</option>
          <option value="MEDIUM">Media</option>
          <option value="LOW">Baja</option>
        </select>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(0) }}
          className="input min-w-[130px]">
          <option value="">Todas categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-escriba-500" /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay tickets que coincidan con los filtros</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Asunto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Categoría</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Prioridad</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Asignado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">SLA</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const slaDeadline = ticket.slaDeadline ? new Date(ticket.slaDeadline) : null
                  const slaUrgent = slaDeadline && (slaDeadline.getTime() - Date.now()) < 3600000 && ticket.status !== 'CLOSED'
                  return (
                    <tr key={ticket.id}
                      onClick={() => navigate(`/soporte/tickets/${ticket.id}`)}
                      className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-escriba-600">{ticket.ticketNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{ticket.subject}</span>
                          {ticket.slaBreached && (
                            <AlertTriangle className="w-3.5 h-3.5 text-danger-500 shrink-0" />
                          )}
                        </div>
                        {ticket.lastMessage && (
                          <p className="text-[11px] text-neutral-400 mt-0.5 truncate max-w-[280px]">{ticket.lastMessage}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500">{ticket.tenantName || '—'}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{CATEGORY_LABELS[ticket.category] || ticket.category}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[ticket.priority] || ''}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[ticket.status] || ''}`}>
                          {STATUS_LABELS[ticket.status] || ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {ticket.assignedToName ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-escriba-500" />
                              <span className="text-sm text-neutral-600">{ticket.assignedToName.split(' ')[0]}</span>
                            </>
                          ) : (
                            <span className="text-sm text-neutral-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {slaDeadline ? (
                          <div className="flex items-center gap-1">
                            <Clock className={`w-3 h-3 ${slaUrgent ? 'text-danger-500' : 'text-neutral-400'}`} />
                            <span className={`text-xs ${slaUrgent ? 'text-danger-600 font-medium' : 'text-neutral-400'}`}>
                              {timeAgo(slaDeadline)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
                <span className="text-xs text-neutral-400">Página {page + 1} de {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-3 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-30 cursor-pointer">
                    Anterior
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 disabled:opacity-30 cursor-pointer">
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        tenants={tenants}
        onCreated={() => { setShowCreateModal(false); loadTickets() }}
      />
    </motion.div>
  )
}

/* ── Stat Card ───────────────────────────────────── */
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-neutral-400 mt-0.5">{label}</p>
    </div>
  )
}

/* ── Create Ticket Modal ─────────────────────────── */
function CreateTicketModal({ isOpen, onClose, tenants, onCreated }: {
  isOpen: boolean
  onClose: () => void
  tenants: { id: string; businessName: string }[]
  onCreated: () => void
}) {
  const [tenantId, setTenantId] = useState('')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('TECHNICAL')
  const [priority, setPriority] = useState('MEDIUM')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!subject.trim()) return
    setSaving(true)
    try {
      await api.post('/tickets', {
        tenantId: tenantId || undefined,
        subject: subject.trim(),
        category,
        priority,
        body: body.trim() || undefined,
      })
      onCreated()
    } catch (err: any) { alert(err?.message || 'Error al crear ticket') }
    finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo ticket de soporte" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Empresa</label>
          <select value={tenantId} onChange={e => setTenantId(e.target.value)} className="input w-full">
            <option value="">Sin empresa asociada</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.businessName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Asunto *</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="Describe el problema..." className="input w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input w-full">
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prioridad</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="input w-full">
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder="Describe el problema en detalle..." className="input w-full min-h-[100px]" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary cursor-pointer">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !subject.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 cursor-pointer">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            Crear ticket
          </button>
        </div>
      </div>
    </Modal>
  )
}
