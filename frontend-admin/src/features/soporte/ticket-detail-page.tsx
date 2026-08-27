import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Loader2, Send, User, Building2,
  Clock, AlertTriangle, CheckCircle, UserCheck,
  MessageSquare, Paperclip,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { SupportTicket, TicketMessage, TicketStatus } from '@/types/admin'
import { Modal } from '@/components/ui/modal'

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-danger-50 text-danger-600 dark:bg-red-900/30 dark:text-red-400',
  HIGH: 'bg-warning-50 text-warning-600 dark:bg-amber-900/30 dark:text-amber-400',
  MEDIUM: 'bg-info-50 text-info-600 dark:bg-blue-900/30 dark:text-blue-400',
  LOW: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300',
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-200',
  IN_PROGRESS: 'bg-escriba-50 text-escriba-600 dark:bg-escriba-900/30 dark:text-escriba-400',
  WAITING_CUSTOMER: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  CLOSED: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
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

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [adminUsers, setAdminUsers] = useState<{ id: string; firstName: string; lastName: string; role: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [sending, setSending] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)

  const loadTicket = () => {
    if (!id) return
    setLoading(true)
    Promise.all<any>([
      api.get(`/tickets/${id}`),
      api.get(`/tickets/${id}/messages`),
      api.get('/admin-users').catch(() => ({ data: [] })),
    ]).then(([ticketRes, msgRes, usersRes]) => {
      const td = ticketRes?.data ?? ticketRes
      setTicket(td)
      const md = msgRes?.data ?? msgRes
      setMessages(Array.isArray(md) ? md : [])
      const ud = usersRes?.data ?? usersRes
      setAdminUsers(Array.isArray(ud) ? ud : ud?.content ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadTicket() }, [id])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !id) return
    setSending(true)
    try {
      await api.post(`/tickets/${id}/messages`, {
        body: newMessage.trim(),
        isInternalNote,
      })
      setNewMessage('')
      setIsInternalNote(false)
      loadTicket()
    } catch (err: any) { alert(err?.message || 'Error al enviar mensaje') }
    finally { setSending(false) }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return
    try {
      await api.put(`/tickets/${id}`, { status })
      setShowManageModal(false)
      loadTicket()
    } catch (err: any) { alert(err?.message || 'Error al actualizar') }
  }

  const handleAssign = async (adminUserId: string) => {
    if (!id) return
    try {
      await api.post(`/tickets/${id}/assign/${adminUserId}`)
      setShowManageModal(false)
      loadTicket()
    } catch (err: any) { alert(err?.message || 'Error al asignar') }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-escriba-500" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-20 text-neutral-400">
        <p>Ticket no encontrado</p>
        <Link to="/soporte" className="text-escriba-600 text-sm mt-2 inline-block">Volver a la bandeja</Link>
      </div>
    )
  }

  const slaDeadline = ticket.slaDeadline ? new Date(ticket.slaDeadline) : null
  const slaUrgent = slaDeadline && (slaDeadline.getTime() - Date.now()) < 3600000 && ticket.status !== 'CLOSED'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/soporte"
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{ticket.subject}</h1>
            <span className="text-sm font-mono text-escriba-600 bg-escriba-50 dark:bg-escriba-900/20 px-2 py-0.5 rounded">
              {ticket.ticketNumber}
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Creado {new Date(ticket.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            {ticket.tenantName && ` · ${ticket.tenantName}`}
          </p>
        </div>
        <button onClick={() => setShowManageModal(true)}
          className="btn-primary text-sm px-4 py-2 cursor-pointer">
          Gestionar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-5 h-5 text-neutral-400" />
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                Conversación ({messages.length})
              </h3>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {messages.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">No hay mensajes aún</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id}
                    className={`flex gap-3 ${msg.isInternalNote ? 'opacity-70' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.senderType === 'ADMIN'
                        ? 'bg-escriba-100 text-escriba-600'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {msg.senderType === 'ADMIN' ? 'A' : 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {msg.senderType === 'ADMIN' ? 'Agente ESCRIBA' : 'Cliente'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(msg.createdAt).toLocaleString('es-CO')}
                        </span>
                        {msg.isInternalNote && (
                          <span className="text-[10px] bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                            Interna
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${msg.isInternalNote ? 'text-neutral-500 italic' : 'text-neutral-700 dark:text-neutral-300'} whitespace-pre-wrap`}>
                        {msg.body}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message composer */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="input w-full min-h-[80px] mb-3"
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendMessage() }}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer">
                <input type="checkbox" checked={isInternalNote} onChange={e => setIsInternalNote(e.target.checked)}
                  className="rounded border-neutral-300" />
                Nota interna (solo visible para el equipo ESCRIBA)
              </label>
              <button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50 cursor-pointer">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar
              </button>
            </div>
          </div>
        </div>

        {/* Management panel */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Información</h3>
            <div className="space-y-3 text-sm">
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Estado">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                  {STATUS_LABELS[ticket.status]}
                </span>
              </InfoRow>
              <InfoRow label="Prioridad">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </InfoRow>
              <InfoRow label="Categoría">
                <span className="text-neutral-600 dark:text-neutral-300">{CATEGORY_LABELS[ticket.category]}</span>
              </InfoRow>
              <InfoRow label="Empresa">
                <span className="text-neutral-600 dark:text-neutral-300">{ticket.tenantName || '—'}</span>
              </InfoRow>
              <InfoRow label="Mensajes">
                <span className="text-neutral-600 dark:text-neutral-300">{messages.length}</span>
              </InfoRow>
              <InfoRow label="Asignado a">
                <div className="flex items-center gap-1.5">
                  {ticket.assignedToName ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-escriba-500" />
                      <span className="text-neutral-600 dark:text-neutral-300">{ticket.assignedToName}</span>
                    </>
                  ) : (
                    <span className="text-neutral-400">Sin asignar</span>
                  )}
                </div>
              </InfoRow>
              {slaDeadline && (
                <InfoRow icon={<AlertTriangle className={`w-4 h-4 ${slaUrgent ? 'text-danger-500' : 'text-neutral-400'}`} />} label="SLA">
                  <span className={slaUrgent ? 'text-danger-600 font-medium' : 'text-neutral-600 dark:text-neutral-300'}>
                    {slaDeadline.toLocaleString('es-CO')}
                    {ticket.slaBreached && ' (vencido)'}
                  </span>
                </InfoRow>
              )}
            </div>
          </div>

          {/* Ticket stats */}
          {ticket.closedAt && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">Ticket cerrado</h3>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                {new Date(ticket.closedAt).toLocaleString('es-CO')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Manage Modal */}
      <ManageTicketModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        ticket={ticket}
        adminUsers={adminUsers}
        onStatusChange={handleStatusChange}
        onAssign={handleAssign}
      />
    </motion.div>
  )
}

function InfoRow({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-400 text-xs">{label}</span>
      <div className="flex items-center gap-1.5">{icon}{children}</div>
    </div>
  )
}

function ManageTicketModal({ isOpen, onClose, ticket, adminUsers, onStatusChange, onAssign }: {
  isOpen: boolean
  onClose: () => void
  ticket: SupportTicket
  adminUsers: { id: string; firstName: string; lastName: string; role: string }[]
  onStatusChange: (status: string) => void
  onAssign: (userId: string) => void
}) {
  const [selectedStatus, setSelectedStatus] = useState(ticket.status)
  const [selectedAssignee, setSelectedAssignee] = useState(ticket.assignedTo || '')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gestionar ${ticket.ticketNumber}`} size="md">
      <div className="space-y-5">
        {/* Status change */}
        <div>
          <label className="block text-sm font-medium mb-2">Cambiar estado</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <button key={value}
                onClick={() => { setSelectedStatus(value as TicketStatus); onStatusChange(value) }}
                className={`p-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                  selectedStatus === value
                    ? 'bg-escriba-50 border-escriba-300 text-escriba-700'
                    : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Assign */}
        <div>
          <label className="block text-sm font-medium mb-2">Asignar a</label>
          <select value={selectedAssignee} onChange={e => { setSelectedAssignee(e.target.value); onAssign(e.target.value) }}
            className="input w-full">
            <option value="">Sin asignar</option>
            {adminUsers.map(u => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="btn-secondary cursor-pointer">Cerrar</button>
        </div>
      </div>
    </Modal>
  )
}
