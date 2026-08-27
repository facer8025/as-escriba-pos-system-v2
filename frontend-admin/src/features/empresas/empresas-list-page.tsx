import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, Search, Loader2 } from 'lucide-react'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { api } from '@/lib/api'
import { formatDate, getTenantStatusBadgeClass } from '@/lib/utils'
import type { AdminRoleCode, Tenant } from '@/types/admin'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'TRIAL', label: 'En trial' },
  { value: 'SUSPENDED', label: 'Suspendida' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

export function EmpresasListPage() {
  const { user } = useAdminAuthStore()
  const userRole = user?.role as AdminRoleCode
  const canWrite = userRole === 'SA' || userRole === 'AC'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchTenants = useCallback(async () => {
    setLoading(true)
    try {
      const response: any = await api.get('/tenants', {
        search: search || undefined,
        status: statusFilter || undefined,
        page: String(page),
        size: '20',
      })
      const data = response?.data ?? response
      setTenants(data?.content ?? data ?? [])
      setTotalPages(data?.totalPages ?? 1)
      setTotal(data?.totalElements ?? data?.length ?? 0)
    } catch (err) {
      console.error('[Empresas] Error fetching:', err)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => { fetchTenants() }, [fetchTenants])

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [search, statusFilter])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Empresas
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {total} empresas registradas
          </p>
        </div>
        {canWrite && (
          <Link to="/empresas/nueva" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nueva empresa
          </Link>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total', value: total, color: 'bg-neutral-100 dark:bg-neutral-800' },
          { label: 'Activas', value: tenants.filter(t => t.status === 'ACTIVE').length, color: 'bg-success-50 dark:bg-green-900/20' },
          { label: 'En trial', value: tenants.filter(t => t.status === 'TRIAL').length, color: 'bg-warning-50 dark:bg-amber-900/20' },
          { label: 'Suspendidas', value: tenants.filter(t => t.status === 'SUSPENDED').length, color: 'bg-danger-50 dark:bg-red-900/20' },
          { label: 'Canceladas', value: tenants.filter(t => t.status === 'CANCELLED').length, color: 'bg-neutral-100 dark:bg-neutral-800' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{stat.label}</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o NIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-40"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select className="input w-40">
          <option value="">Todos los planes</option>
          <option value="basico">Básico</option>
          <option value="estandar">Estándar</option>
          <option value="profesional">Profesional</option>
          <option value="empresarial">Empresarial</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-escriba-500" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-16 text-neutral-400">
            <p className="text-lg font-medium">Sin resultados</p>
            <p className="text-sm mt-1">No se encontraron empresas con los filtros actuales</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Empresa</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">NIT</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Ubicación</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Estado</th>
                <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Registro</th>
                <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/empresas/${tenant.id}`} className="text-sm font-medium text-escriba-600 dark:text-escriba-400 hover:underline">
                      {tenant.businessName}
                    </Link>
                    <p className="text-xs text-neutral-400">{tenant.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 font-mono">{tenant.nit}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">{tenant.city || '-'}{tenant.department ? `, ${tenant.department}` : ''}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getTenantStatusBadgeClass(tenant.status)}`}>
                      {tenant.status === 'ACTIVE' ? 'Activa' : tenant.status === 'TRIAL' ? 'Trial' : tenant.status === 'SUSPENDED' ? 'Suspendida' : 'Cancelada'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(tenant.registeredAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/empresas/${tenant.id}`} className="text-xs text-escriba-600 dark:text-escriba-400 hover:underline font-medium">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="flex items-center text-sm text-neutral-500 px-3">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </motion.div>
  )
}
