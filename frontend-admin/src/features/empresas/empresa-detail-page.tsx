import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, ExternalLink, Edit3, Loader2, AlertTriangle, Key, FileText, Ticket, Activity, Wrench } from 'lucide-react'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { api } from '@/lib/api'
import { formatDate, getTenantStatusBadgeClass } from '@/lib/utils'
import type { AdminRoleCode, Tenant } from '@/types/admin'

export function EmpresaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAdminAuthStore()
  const userRole = user?.role as AdminRoleCode
  const canWrite = userRole === 'SA' || userRole === 'AC'
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('resumen')
  const [showImpersonateModal, setShowImpersonateModal] = useState(false)
  const [impersonateReason, setImpersonateReason] = useState('')

  useEffect(() => {
    if (!id) return
    api.get(`/tenants/${id}`)
      .then((response: any) => {
        const data = response?.data ?? response
        setTenant(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[EmpresaDetail] Error:', err)
        setError('Error al cargar datos de la empresa')
        setLoading(false)
      })
  }, [id])

  const handleImpersonate = async () => {
    if (!impersonateReason.trim() || !id) return
    try {
      const response: any = await api.post(`/tenants/${id}/impersonate`, { reason: impersonateReason })
      const data = response?.data ?? response
      if (data?.token) {
        // Open new tab with impersonation token
        const impersonationUrl = `${window.location.origin}/app/impersonate?token=${data.token}`
        window.open(impersonationUrl, '_blank')
        setShowImpersonateModal(false)
        setImpersonateReason('')
      }
    } catch (err: any) {
      alert(err?.message || 'Error al generar token de acceso')
    }
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
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'resumen' && (
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
                <InfoRow label="Teléfono" value={tenant.phone || '—'} />
                <InfoRow label="Ubicación" value={`${tenant.city || ''}${tenant.department ? `, ${tenant.department}` : ''}`} />
                <InfoRow label="Schema BD" value={tenant.schemaName} />
                <InfoRow label="Zona horaria" value={tenant.timezone} />
                <InfoRow label="Registro" value={formatDate(tenant.registeredAt)} />
                <InfoRow label="Estado" value={tenant.status} />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Acciones rápidas</h4>
              <div className="space-y-2">
                {canWrite && (
                  <button onClick={() => setShowImpersonateModal(true)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer">
                    <ExternalLink className="w-4 h-4 text-escriba-500" />
                    Acceder al panel de la empresa
                  </button>
                )}
                <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer">
                  <Key className="w-4 h-4 text-amber-500" />
                  Gestionar licencia
                </button>
                <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer">
                  <Wrench className="w-4 h-4 text-neutral-400" />
                  Cambiar plan
                </button>
              </div>
            </div>
            {tenant.suspensionReason && (
              <div className="bg-danger-50 dark:bg-red-900/20 rounded-2xl border border-danger-200 dark:border-red-800 p-4">
                <h4 className="text-xs font-semibold text-danger-600 uppercase tracking-wider mb-1">Motivo de suspensión</h4>
                <p className="text-sm text-danger-700 dark:text-danger-400">{tenant.suspensionReason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab !== 'resumen' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
          <p className="text-neutral-400">Módulo en desarrollo</p>
        </div>
      )}

      {/* Impersonation Modal */}
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
