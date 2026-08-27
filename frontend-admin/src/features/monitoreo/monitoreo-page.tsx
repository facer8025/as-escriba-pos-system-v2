import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Server, Database, HardDrive, Mail, FileText,
  CheckCircle, AlertTriangle, XCircle, Loader2,
  BarChart3, Users, Ticket, CreditCard, Clock,
} from 'lucide-react'
import { api } from '@/lib/api'

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'API REST': <Server className="w-5 h-5" />,
  'PostgreSQL': <Database className="w-5 h-5" />,
  'Redis': <HardDrive className="w-5 h-5" />,
  'Email SMTP': <Mail className="w-5 h-5" />,
  'DIAN Provider': <FileText className="w-5 h-5" />,
  'File Storage': <HardDrive className="w-5 h-5" />,
}

export function MonitoreoPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/monitoring/dashboard').then((r: any) => {
      const d = r?.data ?? r
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-escriba-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-neutral-400">
        <p className="text-sm">No hay datos de monitoreo</p>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Monitoreo del sistema</h1>
        <p className="text-sm text-neutral-500 mt-1">Salud del sistema, métricas globales y estado de servicios</p>
      </div>

      {/* Service health */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Estado de servicios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(data.services || []).map((svc: any) => (
            <div key={svc.serviceName} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                svc.status === 'UP' ? 'bg-green-50 text-green-600' :
                svc.status === 'DEGRADED' ? 'bg-amber-50 text-amber-600' :
                'bg-red-50 text-red-600'
              }`}>
                {SERVICE_ICONS[svc.serviceName] || <Server className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{svc.serviceName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {svc.status === 'UP' ? (
                    <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" />Operacional</span>
                  ) : svc.status === 'DEGRADED' ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="w-3 h-3" />Degradado</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="w-3 h-3" />Caído</span>
                  )}
                  <span className="text-[10px] text-neutral-400">· {svc.uptime30d?.toFixed(1)}% uptime</span>
                </div>
                {svc.lastIncident && (
                  <p className="text-[10px] text-amber-600 mt-0.5">Último incidente: {svc.lastIncident}</p>
                )}
              </div>
              <div className="text-right text-[10px] text-neutral-400">
                <p>{svc.responseTimeMs}ms</p>
                {svc.lastCheck && <p className="text-[10px]">{new Date(svc.lastCheck).toLocaleTimeString('es-CO')}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System metrics */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Métricas del sistema
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={<BuildingIcon />} label="Total empresas" value={data.metrics?.totalTenants ?? 0} color="text-escriba-600" />
          <MetricCard icon={<CheckCircle className="w-4 h-4" />} label="Empresas activas" value={data.metrics?.activeTenants ?? 0} color="text-green-600" />
          <MetricCard icon={<KeyIcon />} label="Licencias activas" value={data.metrics?.activeLicenses ?? 0} color="text-blue-600" />
          <MetricCard icon={<Ticket className="w-4 h-4" />} label="Tickets abiertos" value={data.metrics?.ticketsOpen ?? 0} color="text-amber-600" />
          <MetricCard icon={<FileText className="w-4 h-4" />} label="Facturas hoy" value={data.metrics?.invoicesToday ?? 0} color="text-escriba-600" />
          <MetricCard icon={<Users className="w-4 h-4" />} label="Total licencias" value={data.metrics?.totalLicenses ?? 0} color="text-neutral-600 dark:text-neutral-300" />
        </div>
      </div>

      {/* Recent Errors */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Log de errores recientes
        </h2>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          {data.recentErrors && data.recentErrors.length > 0 ? (
            <div className="space-y-2">
              {data.recentErrors.map((err: string, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-700 dark:text-red-400 font-mono">{err}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-neutral-400">Sin errores recientes</p>
              <p className="text-xs text-neutral-400 mt-1">Los health checks se ejecutan cada 5 minutos</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={color}>{icon}</span>
        <span className="text-xs text-neutral-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
    </div>
  )
}

function BuildingIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 7v14M9 21V3h6v18M9 7h6M9 11h6M9 15h6" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  )
}
