import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Loader2, Search, Download,
  Filter, AlertTriangle, CheckCircle, XCircle,
} from 'lucide-react'
import { api } from '@/lib/api'

export function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [result, setResult] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [activeTab, setActiveTab] = useState<'logs' | 'alerts'>('logs')

  const handleExportCsv = () => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (result) params.set('result', result)
    window.open(`/api/v1/admin/audit/logs/export/csv?${params.toString()}`, '_blank')
  }

  const loadData = useCallback(() => {
    setLoading(true)
    const params: Record<string, any> = { page: String(page), size: '30' }
    if (category) params.category = category
    if (result) params.result = result

    Promise.all([
      api.get('/audit/logs', params),
      api.get('/audit/alerts', { page: '0', size: '10' }),
    ]).then(([logsRes, alertsRes]: any[]) => {
      const ld = logsRes?.data ?? logsRes
      setLogs(ld?.content ?? ld ?? [])
      setTotalPages(ld?.totalPages ?? 0)
      const ad = alertsRes?.data ?? alertsRes
      setAlerts(ad?.content ?? ad ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [page, category, result])

  useEffect(() => { loadData() }, [loadData])

  const formatDateTime = (ts: string) => {
    return new Date(ts).toLocaleDateString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Auditoría global</h1>
          <p className="text-sm text-neutral-500 mt-1">Log de eventos y alertas de seguridad</p>
        </div>
        <button onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 text-sm font-medium transition-all cursor-pointer">
          <Download className="w-4 h-4" />
          Exportar logs
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        <button onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            activeTab === 'logs' ? 'border-escriba-600 text-escriba-600' : 'border-transparent text-neutral-500'
          }`}>
          Log de auditoría ({logs.length})
        </button>
        <button onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            activeTab === 'alerts' ? 'border-escriba-600 text-escriba-600' : 'border-transparent text-neutral-500'
          }`}>
          Alertas de seguridad
          {alerts.filter(a => a.status === 'NEW').length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-danger-500 text-white rounded-full">
              {alerts.filter(a => a.status === 'NEW').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'logs' && (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(0) }}
              className="input min-w-[150px]">
              <option value="">Todas categorías</option>
              <option value="AUTH">Autenticación</option>
              <option value="TENANT">Empresas</option>
              <option value="PLAN">Planes</option>
              <option value="LICENSE">Licencias</option>
              <option value="INVOICE">Facturación</option>
              <option value="TICKET">Soporte</option>
              <option value="ADMIN_USER">Usuarios Admin</option>
              <option value="SECURITY">Seguridad</option>
            </select>
            <select value={result} onChange={e => { setResult(e.target.value); setPage(0) }}
              className="input min-w-[130px]">
              <option value="">Todos resultados</option>
              <option value="SUCCESS">Éxito</option>
              <option value="ERROR">Error</option>
              <option value="BLOCKED">Bloqueado</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-escriba-500" /></div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <Shield className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No hay eventos de auditoría</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {logs.map((log: any) => (
                  <div key={log.id} className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        log.result === 'SUCCESS' ? 'bg-green-500' :
                        log.result === 'ERROR' ? 'bg-danger-500' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-[10px] text-neutral-400">{formatDateTime(log.timestamp)}</span>
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">{log.adminEmail || 'Sistema'}</span>
                          <span className="text-neutral-500">{log.action}</span>
                          {log.targetTenantName && <strong className="text-neutral-700 dark:text-neutral-200">{log.targetTenantName}</strong>}
                        </div>
                        {log.description && (
                          <p className="text-xs text-neutral-400 mt-0.5">{log.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                            {log.category}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            log.result === 'SUCCESS' ? 'bg-green-50 text-green-600' :
                            log.result === 'ERROR' ? 'bg-danger-50 text-danger-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>{log.result}</span>
                          {log.ipAddress && <span className="text-[10px] text-neutral-400">{log.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
                <span className="text-xs text-neutral-400">Página {page + 1} de {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-3 py-1 text-xs rounded-lg border disabled:opacity-30 cursor-pointer">Anterior</button>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-xs rounded-lg border disabled:opacity-30 cursor-pointer">Siguiente</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-sm font-semibold mb-4">Alertas activas</h3>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">No hay alertas activas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert: any) => (
                  <div key={alert.id} className={`p-3 rounded-xl border ${
                    alert.status === 'NEW' ? 'bg-danger-50 border-danger-200' :
                    alert.status === 'REVIEWED' ? 'bg-amber-50 border-amber-200' :
                    'bg-neutral-50 border-neutral-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                        alert.status === 'NEW' ? 'text-danger-500' : 'text-amber-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{alert.ruleCode}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{alert.description}</p>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          {new Date(alert.triggeredAt).toLocaleString('es-CO')}
                          {alert.tenantName && ` · ${alert.tenantName}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-sm font-semibold mb-4">Resumen</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <span className="text-sm text-neutral-600 dark:text-neutral-300">Nuevas</span>
                <span className="text-sm font-bold text-danger-600">{alerts.filter((a: any) => a.status === 'NEW').length}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <span className="text-sm text-neutral-600 dark:text-neutral-300">Revisadas</span>
                <span className="text-sm font-bold text-amber-600">{alerts.filter((a: any) => a.status === 'REVIEWED').length}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                <span className="text-sm text-neutral-600 dark:text-neutral-300">Falso positivo</span>
                <span className="text-sm font-bold text-neutral-600 dark:text-neutral-300">{alerts.filter((a: any) => a.status === 'FALSE_POSITIVE').length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
