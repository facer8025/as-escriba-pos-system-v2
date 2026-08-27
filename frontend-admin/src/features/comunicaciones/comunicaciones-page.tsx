import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Send, Loader2, Megaphone, Clock, CheckCircle,
  AlertTriangle, Mail, Smartphone, Globe, PanelRight,
  FileText, Calendar, Eye, Trash2, Copy, Ban,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Announcement } from '@/types/admin'
import { Modal } from '@/components/ui/modal'

const TYPE_LABELS: Record<string, string> = {
  GENERAL: 'Comunicado general',
  MAINTENANCE: 'Mantenimiento',
  NEW_FEATURE: 'Nueva funcionalidad',
  ALERT: 'Alerta',
  NEWSLETTER: 'Newsletter',
}

const TYPE_COLORS: Record<string, string> = {
  GENERAL: 'bg-escriba-50 text-escriba-600 dark:bg-escriba-900/20',
  MAINTENANCE: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
  NEW_FEATURE: 'bg-green-50 text-green-600 dark:bg-green-900/20',
  ALERT: 'bg-danger-50 text-danger-600 dark:bg-danger-900/20',
  NEWSLETTER: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800',
  SCHEDULED: 'bg-info-50 text-info-600 dark:bg-blue-900/20',
  SENT: 'bg-green-50 text-green-600 dark:bg-green-900/20',
  CANCELLED: 'bg-danger-50 text-danger-600 dark:bg-danger-900/20',
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="w-3.5 h-3.5" />,
  BANNER: <PanelRight className="w-3.5 h-3.5" />,
  IN_APP: <Globe className="w-3.5 h-3.5" />,
  SMS: <Smartphone className="w-3.5 h-3.5" />,
}

interface Template {
  id: string
  name: string
  type: string
  subject: string
  bodyHtml: string
}

export function ComunicacionesPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [showTemplates, setShowTemplates] = useState(false)

  const loadAnnouncements = useCallback(() => {
    setLoading(true)
    const params: Record<string, any> = { page: '0', size: '50' }
    if (statusFilter) params.status = statusFilter

    api.get('/announcements', params).then((r: any) => {
      const d = r?.data ?? r
      setAnnouncements(d?.content ?? d ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { loadAnnouncements() }, [loadAnnouncements])

  // Load templates from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('escriba-announcement-templates')
      if (saved) setTemplates(JSON.parse(saved))
    } catch {}
  }, [])

  const saveTemplates = (newTemplates: Template[]) => {
    setTemplates(newTemplates)
    localStorage.setItem('escriba-announcement-templates', JSON.stringify(newTemplates))
  }

  const handleSend = async (id: string) => {
    if (!confirm('¿Enviar este comunicado a todas las empresas activas?')) return
    try {
      await api.post(`/announcements/${id}/send`)
      loadAnnouncements()
    } catch (err: any) { alert(err?.message || 'Error al enviar') }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `${days}d`
    const hrs = Math.floor(diff / 3600000)
    if (hrs > 0) return `${hrs}h`
    return `${Math.floor(diff / 60000)}m`
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Comunicaciones</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Anuncios, comunicados y avisos de mantenimiento para empresas
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTemplates(true)}
            className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5 cursor-pointer">
            <FileText className="w-4 h-4" />
            Plantillas
          </button>
          <button onClick={() => setShowComposer(true)}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Nuevo comunicado
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { label: 'Todos', value: '' },
          { label: 'Borradores', value: 'DRAFT' },
          { label: 'Programados', value: 'SCHEDULED' },
          { label: 'Enviados', value: 'SENT' },
        ].map(f => (
          <button key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === f.value
                ? 'bg-escriba-600 text-white'
                : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border p-3 text-center">
          <p className="text-lg font-bold text-escriba-600">{announcements.filter(a => a.status === 'DRAFT').length}</p>
          <p className="text-[10px] text-neutral-400">Borradores</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border p-3 text-center">
          <p className="text-lg font-bold text-info-600">{announcements.filter(a => a.status === 'SCHEDULED').length}</p>
          <p className="text-[10px] text-neutral-400">Programados</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border p-3 text-center">
          <p className="text-lg font-bold text-green-600">{announcements.filter(a => a.status === 'SENT').length}</p>
          <p className="text-[10px] text-neutral-400">Enviados</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border p-3 text-center">
          <p className="text-lg font-bold text-neutral-600 dark:text-neutral-300">
            {announcements.reduce((sum, a) => sum + (a.totalRecipients || 0), 0)}
          </p>
          <p className="text-[10px] text-neutral-400">Total destinatarios</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-escriba-500" /></div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay comunicados aún</p>
            <button onClick={() => setShowComposer(true)}
              className="text-escriba-600 text-sm mt-2 hover:underline cursor-pointer">
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {announcements.map(a => (
              <div key={a.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[a.type] || ''}`}>
                        {TYPE_LABELS[a.type] || a.type}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[a.status] || ''}`}>
                        {a.status === 'DRAFT' ? 'Borrador' :
                         a.status === 'SCHEDULED' ? 'Programado' :
                         a.status === 'SENT' ? 'Enviado' : 'Cancelado'}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{a.title}</h3>
                    {a.scheduledAt && a.status === 'SCHEDULED' && (
                      <p className="text-xs text-info-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Programado: {formatDate(a.scheduledAt)}
                      </p>
                    )}
                    {a.sentAt && (
                      <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                        <Send className="w-3 h-3" />
                        Enviado {timeAgo(a.sentAt)}
                        {a.totalRecipients > 0 && ` · ${a.totalRecipients} destinatarios`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {a.status === 'DRAFT' && (
                      <>
                        <button onClick={() => handleSend(a.id)}
                          className="p-1.5 rounded-lg text-escriba-500 hover:bg-escriba-50 transition-colors cursor-pointer"
                          title="Enviar ahora">
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-50 transition-colors cursor-pointer"
                          title="Cancelar">
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {a.status === 'SENT' && (
                      <span className="text-xs text-green-600 flex items-center gap-1 px-2">
                        <Eye className="w-3 h-3" />
                        {a.openRate != null ? `${a.openRate}%` : '—'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Composer Modal */}
      <ComposerModal
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        onSaved={() => { setShowComposer(false); loadAnnouncements() }}
        templates={templates}
      />

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        templates={templates}
        onSave={saveTemplates}
        onApply={(tpl) => { setShowTemplates(false); setShowComposer(true) }}
      />
    </motion.div>
  )
}

/* ── COMPOSER MODAL ───────────────────────────────────────────── */

function ComposerModal({ isOpen, onClose, onSaved, templates }: {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  templates: Template[]
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('GENERAL')
  const [bodyHtml, setBodyHtml] = useState('')
  const [channels, setChannels] = useState<string[]>(['EMAIL'])
  const [bannerDuration, setBannerDuration] = useState('7')
  const [schedule, setSchedule] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Segmentación
  const [targetPlans, setTargetPlans] = useState<string[]>([])
  const [targetStatuses, setTargetStatuses] = useState<string[]>(['ACTIVE'])
  const [excludeTenants, setExcludeTenants] = useState('')
  const [tenants, setTenants] = useState<{ id: string; businessName: string }[]>([])

  useEffect(() => {
    api.get('/tenants', { page: '0', size: '200' }).then((r: any) => {
      const d = r?.data ?? r
      setTenants(d?.content ?? d ?? [])
    }).catch(() => {})
  }, [])

  const toggleChannel = (ch: string) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])
  }

  const loadTemplate = (templateId: string) => {
    const tpl = templates.find(t => t.id === templateId)
    if (tpl) {
      setTitle(tpl.subject)
      setType(tpl.type)
      setBodyHtml(tpl.bodyHtml)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !bodyHtml.trim()) return
    setSaving(true)
    try {
      const body: any = {
        title: title.trim(),
        type,
        bodyHtml: bodyHtml.trim(),
        channels: channels.length > 0 ? channels : ['EMAIL'],
        bannerDurationDays: parseInt(bannerDuration) || 7,
        targetCriteria: JSON.stringify({
          planSlugs: targetPlans.length > 0 ? targetPlans : undefined,
          statuses: targetStatuses.length > 0 ? targetStatuses : ['ACTIVE'],
          excludeTenantIds: excludeTenants ? excludeTenants.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        }),
      }
      if (schedule) body.scheduledAt = new Date(schedule).toISOString()

      await api.post('/announcements', body)
      onSaved()
    } catch (err: any) { alert(err?.message || 'Error') }
    finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo comunicado" size="xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Template selector */}
        {templates.length > 0 && (
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Cargar desde plantilla</label>
            <select onChange={e => e.target.value && loadTemplate(e.target.value)} className="input w-full text-sm">
              <option value="">Seleccionar plantilla...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Título *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Mantenimiento programado" className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select value={type} onChange={e => setType(e.target.value)} className="input w-full">
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cuerpo (HTML) *</label>
          <div className="flex gap-2 mb-2">
            <button onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-escriba-600 hover:underline cursor-pointer">
              {showPreview ? 'Editar' : 'Vista previa'}
            </button>
          </div>
          {showPreview ? (
            <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 min-h-[200px] prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          ) : (
            <textarea value={bodyHtml} onChange={e => setBodyHtml(e.target.value)}
              placeholder="<h1>Comunicado importante</h1><p>...</p>"
              className="input w-full min-h-[200px] font-mono text-xs" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Canales de envío</label>
          <div className="flex gap-3">
            {[
              { value: 'EMAIL', label: 'Email', icon: <Mail className="w-4 h-4" /> },
              { value: 'BANNER', label: 'Banner', icon: <PanelRight className="w-4 h-4" /> },
              { value: 'IN_APP', label: 'In-App', icon: <Globe className="w-4 h-4" /> },
              { value: 'SMS', label: 'SMS', icon: <Smartphone className="w-4 h-4" /> },
            ].map(ch => (
              <button key={ch.value}
                onClick={() => toggleChannel(ch.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  channels.includes(ch.value)
                    ? 'bg-escriba-50 border-escriba-300 text-escriba-700'
                    : 'border-neutral-200 text-neutral-400 hover:bg-neutral-50'
                }`}>
                {ch.icon}
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Duración banner (días)</label>
            <input type="number" min="1" max="30" value={bannerDuration}
              onChange={e => setBannerDuration(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Programar envío</label>
            <input type="datetime-local" value={schedule}
              onChange={e => setSchedule(e.target.value)} className="input w-full" />
          </div>
        </div>

        {/* Segmentación */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <details className="group">
            <summary className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer list-none">
              <span className="w-5 h-5 rounded flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-open:bg-escriba-50 group-open:text-escriba-600">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </span>
              Segmentación de destinatarios
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Estados de empresa</label>
                <div className="flex gap-2">
                  {['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'].map(st => (
                    <button key={st}
                      onClick={() => setTargetStatuses(prev =>
                        prev.includes(st) ? prev.filter(s => s !== st) : [...prev, st]
                      )}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        targetStatuses.includes(st)
                          ? 'bg-escriba-50 border-escriba-300 text-escriba-700'
                          : 'border-neutral-200 text-neutral-400 hover:bg-neutral-50'
                      }`}>
                      {st === 'ACTIVE' ? 'Activa' : st === 'TRIAL' ? 'Trial' : st === 'SUSPENDED' ? 'Suspendida' : 'Cancelada'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Excluir empresas (IDs separados por coma)</label>
                <input type="text" value={excludeTenants} onChange={e => setExcludeTenants(e.target.value)}
                  placeholder="uuid-1, uuid-2" className="input w-full text-xs" />
              </div>
            </div>
          </details>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <button onClick={onClose} className="btn-secondary cursor-pointer">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !title.trim() || !bodyHtml.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 cursor-pointer">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : schedule ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {schedule ? 'Programar' : 'Guardar borrador'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── TEMPLATES MODAL ──────────────────────────────────────────── */

function TemplatesModal({ isOpen, onClose, templates, onSave, onApply }: {
  isOpen: boolean
  onClose: () => void
  templates: Template[]
  onSave: (templates: Template[]) => void
  onApply: (template: Template) => void
}) {
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState('GENERAL')
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')

  const handleSaveTemplate = () => {
    if (!name.trim() || !bodyHtml.trim()) return
    const newTpl: Template = {
      id: editingTemplate?.id || crypto.randomUUID(),
      name: name.trim(),
      type,
      subject: subject.trim(),
      bodyHtml: bodyHtml.trim(),
    }
    if (editingTemplate) {
      onSave(templates.map(t => t.id === editingTemplate.id ? newTpl : t))
    } else {
      onSave([...templates, newTpl])
    }
    setEditingTemplate(null)
    setName('')
    setSubject('')
    setBodyHtml('')
  }

  const handleDeleteTemplate = (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return
    onSave(templates.filter(t => t.id !== id))
  }

  const startEdit = (tpl: Template) => {
    setEditingTemplate(tpl)
    setName(tpl.name)
    setType(tpl.type)
    setSubject(tpl.subject)
    setBodyHtml(tpl.bodyHtml)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Plantillas de comunicados" size="lg">
      <div className="space-y-4">
        {/* Template list */}
        {templates.length === 0 && !editingTemplate && (
          <p className="text-center text-neutral-400 py-4 text-sm">No hay plantillas guardadas</p>
        )}

        {templates.map(t => (
          <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{t.name}</p>
              <p className="text-xs text-neutral-400">
                {TYPE_LABELS[t.type] || t.type} · {t.subject}
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onApply(t)}
                className="p-1.5 rounded-lg text-escriba-500 hover:bg-escriba-50 cursor-pointer" title="Usar">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={() => startEdit(t)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-info-500 hover:bg-info-50 cursor-pointer" title="Editar">
                <FileText className="w-4 h-4" />
              </button>
              <button onClick={() => handleDeleteTemplate(t.id)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-danger-500 hover:bg-danger-50 cursor-pointer" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Create/Edit template form */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <h4 className="text-sm font-medium mb-3">
            {editingTemplate ? 'Editar plantilla' : 'Nueva plantilla'}
          </h4>
          <div className="space-y-3">
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Nombre de la plantilla" className="input w-full" />
            <div className="grid grid-cols-2 gap-3">
              <select value={type} onChange={e => setType(e.target.value)} className="input">
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Asunto" className="input" />
            </div>
            <textarea value={bodyHtml} onChange={e => setBodyHtml(e.target.value)}
              placeholder="<h1>Título</h1><p>Cuerpo del comunicado...</p>"
              className="input w-full min-h-[100px] font-mono text-xs" />
            <div className="flex justify-end gap-2">
              {editingTemplate && (
                <button onClick={() => { setEditingTemplate(null); setName(''); setSubject(''); setBodyHtml('') }}
                  className="btn-secondary text-sm cursor-pointer">Cancelar</button>
              )}
              <button onClick={handleSaveTemplate} disabled={!name.trim() || !bodyHtml.trim()}
                className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer">
                {editingTemplate ? 'Actualizar' : 'Guardar plantilla'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
