import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  DollarSign,
  UserPlus,
  Key,
  Ticket,
  Activity,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ReferenceLine,
} from 'recharts'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { DashboardKPIs } from '@/types/admin'

const CHART_COLORS = ['#1a1a2e', '#e94560', '#0f3460', '#16c79a', '#f5a623', '#7c3aed']

const PLAN_COLORS: Record<string, string> = {
  Básico: '#94a3b8',
  Estándar: '#3b82f6',
  Profesional: '#8b5cf6',
  Empresarial: '#f59e0b',
}

export function DashboardPage() {
  const { user } = useAdminAuthStore()
  const userRole = user?.role as string

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock chart data — en producción vendría de la API
  const [mrrData] = useState([
    { month: 'Ago', mrr: 8500000, proy: 8200000 },
    { month: 'Sep', mrr: 9200000, proy: 8900000 },
    { month: 'Oct', mrr: 10100000, proy: 9600000 },
    { month: 'Nov', mrr: 11500000, proy: 10800000 },
    { month: 'Dic', mrr: 12400000, proy: 11800000 },
    { month: 'Ene', mrr: 13200000, proy: 12800000 },
    { month: 'Feb', mrr: 14100000, proy: 13500000 },
    { month: 'Mar', mrr: 14800000, proy: 14300000 },
    { month: 'Abr', mrr: 15600000, proy: 15000000 },
    { month: 'May', mrr: 16300000, proy: 15800000 },
    { month: 'Jun', mrr: 17100000, proy: 16500000 },
    { month: 'Jul', mrr: 17800000, proy: 17200000 },
  ])

  const [planDistribution] = useState([
    { name: 'Básico', value: 45, color: PLAN_COLORS['Básico'] },
    { name: 'Estándar', value: 68, color: PLAN_COLORS['Estándar'] },
    { name: 'Profesional', value: 32, color: PLAN_COLORS['Profesional'] },
    { name: 'Empresarial', value: 12, color: PLAN_COLORS['Empresarial'] },
  ])

  const [evolutionData] = useState([
    { month: 'Feb', altas: 5, bajas: 1, total: 142 },
    { month: 'Mar', altas: 8, bajas: 2, total: 148 },
    { month: 'Abr', altas: 6, bajas: 3, total: 151 },
    { month: 'May', altas: 10, bajas: 1, total: 160 },
    { month: 'Jun', altas: 7, bajas: 2, total: 165 },
    { month: 'Jul', altas: 12, bajas: 3, total: 174 },
  ])

  const [churnData] = useState([
    { month: 'Feb', rate: 1.4 },
    { month: 'Mar', rate: 1.8 },
    { month: 'Abr', rate: 2.0 },
    { month: 'May', rate: 0.9 },
    { month: 'Jun', rate: 1.2 },
    { month: 'Jul', rate: 1.7 },
  ])

  useEffect(() => {
    api.get<DashboardKPIs>('/dashboard/kpis')
      .then((response: any) => {
        const data = response?.data ?? response
        setKpis(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[Admin Dashboard] Error:', err)
        setError('Error al cargar el dashboard')
        setLoading(false)
      })
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-escriba-500" />
      </div>
    )
  }

  if (error || !kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">{error || 'No se pudieron cargar los datos'}</p>
      </div>
    )
  }

  const activeCount = kpis.activeCompanies + kpis.trialCompanies + kpis.suspendedCompanies

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Dashboard Global</h1>
        <p className="text-sm text-neutral-500 mt-1">Resumen del estado del sistema ESCRIBA</p>
      </div>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Empresas activas" value={kpis.activeCompanies}
          subtitle={`${kpis.trialCompanies} en trial · ${kpis.suspendedCompanies} suspendidas`}
          icon={<Building2 className="w-5 h-5" />}
          color="bg-escriba-50 text-escriba-600" trend={5.2} />
        <KpiCard title="MRR" value={formatCurrency(kpis.mrr)}
          subtitle={`ARR: ${formatCurrency(kpis.arr)}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-green-50 text-green-600" trend={8.1} />
        <KpiCard title="Nuevos contratos (este mes)" value={kpis.newContractsMonth}
          subtitle="vs. mes anterior"
          icon={<UserPlus className="w-5 h-5" />}
          color="bg-blue-50 text-blue-600" trend={-2.3} />
        <KpiCard title="Tickets sin resolver" value={kpis.openTickets}
          subtitle="Requieren atención"
          icon={<Ticket className="w-5 h-5" />}
          color="bg-amber-50 text-amber-600" trend={-5} trendInverse />
        <KpiCard title="Licencias por vencer (30d)" value={kpis.licensesExpiring30d}
          subtitle="Próximas a expirar"
          icon={<Key className="w-5 h-5" />}
          color="bg-red-50 text-red-600" trend={12} trendInverse />
        <KpiCard title="Total empresas" value={activeCount}
          subtitle="Activas + Trial + Suspendidas"
          icon={<Building2 className="w-5 h-5" />}
          color="bg-purple-50 text-purple-600" />
        <KpiCard title="Ingreso promedio" value={kpis.activeCompanies > 0 ? formatCurrency(Math.round(kpis.mrr / kpis.activeCompanies)) : '$0'}
          subtitle="MRR / empresas activas"
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-teal-50 text-teal-600" />
        <KpiCard title="Licencias activas" value={kpis.licensesExpiring30d > 0 ? '—' : '—'}
          subtitle="Estimado de conversión"
          icon={<Key className="w-5 h-5" />}
          color="bg-indigo-50 text-indigo-600" />
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: MRR Growth */}
        <motion.div variants={item} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-sm font-semibold mb-4">Crecimiento de MRR (12 meses)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a1a2e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1a1a2e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af"
                tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Area type="monotone" dataKey="mrr" stroke="#1a1a2e" fill="url(#mrrGradient)" strokeWidth={2} name="MRR real" />
              <Line type="monotone" dataKey="proy" stroke="#e94560" strokeWidth={2} strokeDasharray="5 5" name="Proyección" dot={false} />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Chart 2: Plan Distribution */}
        <motion.div variants={item} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-sm font-semibold mb-4">Distribución por plan</h3>
          <div className="flex items-center h-[260px]">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie data={planDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                  paddingAngle={3} dataKey="value" nameKey="name">
                  {planDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, name: any) => [`${v} empresas`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {planDistribution.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-neutral-600 dark:text-neutral-300">{p.name}</span>
                  <span className="text-xs font-medium">{p.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Total:</span>
                  <span className="text-xs font-bold">{planDistribution.reduce((s, p) => s + p.value, 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chart 3: Active vs Cancelled */}
        <motion.div variants={item} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-sm font-semibold mb-4">Evolución: altas vs. bajas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip />
              <Legend />
              <Bar dataKey="altas" name="Nuevas altas" fill="#16c79a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bajas" name="Cancelaciones" fill="#e94560" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="total" name="Total acumulado" stroke="#1a1a2e" strokeWidth={2} dot={{ r: 3 }} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Chart 4: Churn Rate */}
        <motion.div variants={item} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h3 className="text-sm font-semibold mb-4">Churn rate mensual</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={churnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af"
                tickFormatter={(v) => `${v}%`} domain={[0, 5]} />
              <Tooltip formatter={(v: any) => `${v.toFixed(1)}%`} />
              <ReferenceLine y={3} stroke="#e94560" strokeDasharray="5 5" label={{ value: 'Benchmark 3%', position: 'right', fontSize: 10 }} />
              <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }}
                name="Churn rate" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Service Health + Activity + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Service Health */}
          <motion.div variants={item} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-neutral-400" />
              Estado del sistema
            </h3>
            <div className="space-y-3">
              {kpis.services.map((service) => (
                <div key={service.serviceName} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      service.status === 'UP' ? 'bg-green-500' :
                      service.status === 'DEGRADED' ? 'bg-amber-500' : 'bg-danger-500'
                    }`} />
                    <span className="text-sm text-neutral-700 dark:text-neutral-200">{service.serviceName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-400">
                    <span className="font-mono">{service.uptime30d}% uptime</span>
                    {service.lastIncident && <span className="text-amber-600">{service.lastIncident}</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={item} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-sm font-semibold mb-4">Actividad reciente</h3>
            <div className="space-y-3">
              {kpis.recentActivity.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">Sin actividad reciente</p>
              ) : (
                kpis.recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-neutral-100 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-escriba-50 flex items-center justify-center text-escriba-600 text-xs font-semibold shrink-0">
                      {activity.user.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-700 dark:text-neutral-200">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">{activity.user}</span>{' '}
                        {activity.action}{' '}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">{activity.time}</p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded-md bg-neutral-100 text-neutral-500">{activity.module}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <motion.div variants={item} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-sm font-semibold mb-4">Resumen rápido</h3>
            <div className="space-y-4">
              <SummaryRow label="Total empresas" value={activeCount} />
              <SummaryRow label="Ingreso promedio por empresa"
                value={kpis.activeCompanies > 0 ? formatCurrency(Math.round(kpis.mrr / kpis.activeCompanies)) : '$0'} />
              <SummaryRow label="Trial→pago (estimado)" value="—%" />
              <SummaryRow label="Churn rate mensual" value="—%" />
            </div>
          </motion.div>

          {/* Top 10 table placeholder */}
          <motion.div variants={item} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <h3 className="text-sm font-semibold mb-4">Top empresas por volumen</h3>
            <p className="text-xs text-neutral-400">Tabla próximamente</p>
          </motion.div>
        </div>
      </div>

      {/* Impersonation banner */}
      {(userRole === 'ST' || userRole === 'AU') && (
        <motion.div variants={item}
          className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-700">
            <strong>Modo {userRole === 'AU' ? 'Auditoría' : 'Soporte'}:</strong> Tienes acceso de {userRole === 'AU' ? 'solo lectura' : 'soporte técnico'}.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

function KpiCard({ title, value, subtitle, icon, color, trend, trendInverse = false }: {
  title: string; value: string | number; subtitle?: string; icon: React.ReactNode
  color: string; trend?: number; trendInverse?: boolean
}) {
  const isPositive = trend && ((trend > 0 && !trendInverse) || (trend < 0 && trendInverse))
  return (
    <motion.div whileHover={{ y: -2 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-xs font-medium text-neutral-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
    </motion.div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{value}</span>
    </div>
  )
}
