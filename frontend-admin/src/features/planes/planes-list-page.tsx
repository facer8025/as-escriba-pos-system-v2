import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Plus, Loader2, Archive } from 'lucide-react'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { AdminRoleCode, Plan } from '@/types/admin'

export function PlanesListPage() {
  const { user } = useAdminAuthStore()
  const userRole = user?.role as AdminRoleCode
  const canWrite = userRole === 'SA' || userRole === 'AC'
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (showArchived) params.status = 'ARCHIVED'
    api.get('/plans', params)
      .then((response: any) => {
        const data = response?.data ?? response
        setPlans(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [showArchived])

  const handleArchive = async (id: number) => {
    try {
      await api.patch(`/plans/${id}/archive`)
      setPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'ARCHIVED' } : p))
    } catch (err: any) { alert(err?.message || 'Error') }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Planes y precios</h1>
          <p className="text-sm text-neutral-500 mt-1">{plans.length} planes {showArchived ? 'archivados' : 'activos'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              showArchived ? 'bg-neutral-100 border-neutral-300 text-neutral-700' : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
            }`}>
            <Archive className="w-3.5 h-3.5" />
            {showArchived ? 'Ver activos' : 'Archivados'}
          </button>
          {canWrite && (
            <Link to="/planes/nuevo" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-escriba-600 hover:bg-escriba-700 text-white text-sm font-medium transition-all">
              <Plus className="w-4 h-4" /> Nuevo plan
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-escriba-500" /></div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No hay planes {showArchived ? 'archivados' : 'activos'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <motion.div key={plan.id} layout
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{plan.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{plan.descriptionShort}</p>
                </div>
                {plan.isFeatured && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">Popular</span>
                )}
              </div>
              <div className="mb-4">
                <p className="text-2xl font-bold text-escriba-600">{formatCurrency(plan.priceMonthly)}<span className="text-sm font-normal text-neutral-400">/mes</span></p>
                {plan.priceAnnual > 0 && (
                  <p className="text-xs text-neutral-400">
                    {formatCurrency(plan.priceAnnual)}/año
                    {plan.annualDiscountPct && plan.annualDiscountPct > 0 && (
                      <span className="text-green-600 ml-1">({plan.annualDiscountPct}% ahorro)</span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {plan.modules?.slice(0, 4).map((m: any) => (
                  <span key={m.code} className="text-[10px] px-2 py-0.5 rounded-full bg-escriba-50 text-escriba-600">{m.name}</span>
                ))}
                {(plan.modules?.length || 0) > 4 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">+{plan.modules!.length - 4}</span>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <div className="flex gap-3 text-[10px] text-neutral-400">
                  <span>{plan.maxUsers ?? '∞'} usuarios</span>
                  {plan.maxProducts && <span>{plan.maxProducts} prod.</span>}
                </div>
                {canWrite && plan.status === 'ACTIVE' && (
                  <button onClick={() => handleArchive(plan.id)}
                    className="text-[10px] text-neutral-400 hover:text-amber-600 cursor-pointer">Archivar</button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
