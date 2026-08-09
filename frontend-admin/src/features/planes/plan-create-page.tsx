import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Loader2, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import type { AdminRoleCode, Module } from '@/types/admin'

const SUPPORT_LEVELS = ['EMAIL', 'EMAIL_CHAT', 'PRIORITY', 'DEDICATED']
const COLORS = ['#4f46e5', '#7c3aed', '#dc2626', '#059669', '#d97706', '#6b7280']

export function PlanCreatePage() {
  const navigate = useNavigate()
  const { user } = useAdminAuthStore()
  const userRole = user?.role as AdminRoleCode
  const canWrite = userRole === 'SA' || userRole === 'AC'
  const [submitting, setSubmitting] = useState(false)
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModules, setSelectedModules] = useState<string[]>([])

  const [form, setForm] = useState({
    name: '', descriptionShort: '', descriptionLong: '',
    priceMonthly: 0, priceAnnual: 0, taxRate: 19,
    badgeColor: '#4f46e5', isFeatured: false, isVisibleWeb: true,
    trialDays: 0, maxUsers: 0, maxBranches: 0, maxProducts: 0,
    maxMonthlyInvoices: 0, storageGb: 0, supportLevel: 'EMAIL',
  })

  const update = (f: string, v: any) => setForm(p => ({ ...p, [f]: v }))

  useEffect(() => {
    api.get('/modules')
      .then((r: any) => { const d = r?.data ?? r; setModules(Array.isArray(d) ? d : []) })
      .catch(() => {})
  }, [])

  const toggleModule = (code: string) => {
    setSelectedModules(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const handleSubmit = async () => {
    if (!form.name || form.priceMonthly <= 0) { alert('Nombre y precio mensual requeridos'); return }
    setSubmitting(true)
    try {
      await api.post('/plans', { ...form, modules: selectedModules })
      alert('Plan creado exitosamente')
      navigate('/planes')
    } catch (err: any) {
      alert(err?.message || 'Error al crear plan')
    } finally { setSubmitting(false) }
  }

  if (!canWrite) return <div className="text-center py-16 text-neutral-500">No tienes permisos</div>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/planes" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Nuevo plan</h1>
          <p className="text-sm text-neutral-500 mt-1">Crear plan de suscripción</p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5">
        {/* Basic info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Nombre del plan *</label>
            <input value={form.name} onChange={e => update('name', e.target.value)} className="input" placeholder="Ej: Profesional" />
          </div>
          <div className="col-span-2"><label className="label">Descripción corta</label>
            <input value={form.descriptionShort} onChange={e => update('descriptionShort', e.target.value)} className="input" placeholder="Ideal para empresas en crecimiento" />
          </div>
          <div className="col-span-2"><label className="label">Descripción larga</label>
            <textarea value={form.descriptionLong} onChange={e => update('descriptionLong', e.target.value)} className="input h-20 resize-none" />
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Precios</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Precio mensual *</label>
              <input type="number" value={form.priceMonthly} onChange={e => update('priceMonthly', Number(e.target.value))} className="input" min={0} />
            </div>
            <div><label className="label">Precio anual</label>
              <input type="number" value={form.priceAnnual} onChange={e => update('priceAnnual', Number(e.target.value))} className="input" min={0} />
            </div>
            <div><label className="label">Días de trial</label>
              <input type="number" value={form.trialDays} onChange={e => update('trialDays', Number(e.target.value))} className="input" min={0} />
            </div>
            <div><label className="label">IVA (%)</label>
              <input type="number" value={form.taxRate ?? 19} onChange={e => update('taxRate', Number(e.target.value))} className="input" min={0} max={100} step={0.01} />
              {form.taxRate > 0 && form.priceMonthly > 0 && (
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Precio con IVA: ${(form.priceMonthly * (1 + form.taxRate / 100)).toLocaleString('es-CO')} COP/mes
                </p>
              )}
            </div>
            <div><label className="label">Nivel de soporte</label>
              <select value={form.supportLevel} onChange={e => update('supportLevel', e.target.value)} className="input">
                {SUPPORT_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Limits */}
        <div>
          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Límites operativos</h4>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Máx. usuarios</label><input type="number" value={form.maxUsers} onChange={e => update('maxUsers', Number(e.target.value))} className="input" min={0} placeholder="0 = ilimitado" /></div>
            <div><label className="label">Máx. sucursales</label><input type="number" value={form.maxBranches} onChange={e => update('maxBranches', Number(e.target.value))} className="input" min={0} /></div>
            <div><label className="label">Máx. productos</label><input type="number" value={form.maxProducts} onChange={e => update('maxProducts', Number(e.target.value))} className="input" min={0} /></div>
            <div><label className="label">Facturas/mes</label><input type="number" value={form.maxMonthlyInvoices} onChange={e => update('maxMonthlyInvoices', Number(e.target.value))} className="input" min={0} /></div>
            <div><label className="label">Almacenamiento (GB)</label><input type="number" value={form.storageGb} onChange={e => update('storageGb', Number(e.target.value))} className="input" min={0} /></div>
          </div>
        </div>

        {/* Color + Flags */}
        <div>
          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Personalización</h4>
          <div className="flex items-center gap-4">
            <div>
              <label className="label">Color</label>
              <div className="flex gap-2 mt-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => update('badgeColor', c)}
                    className={`w-8 h-8 rounded-lg border-2 ${form.badgeColor === c ? 'border-escriba-500 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={e => update('isFeatured', e.target.checked)} className="rounded" /> Destacado</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isVisibleWeb} onChange={e => update('isVisibleWeb', e.target.checked)} className="rounded" /> Visible en web</label>
            </div>
          </div>
        </div>

        {/* Modules */}
        <div>
          <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Módulos incluidos</h4>
          <div className="grid grid-cols-3 gap-2">
            {modules.map(m => (
              <button key={m.code} onClick={() => toggleModule(m.code)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all ${
                  selectedModules.includes(m.code)
                    ? 'bg-escriba-50 dark:bg-escriba-900/20 border-escriba-200 dark:border-escriba-800 text-escriba-700 dark:text-escriba-300'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                }`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center ${selectedModules.includes(m.code) ? 'bg-escriba-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                  {selectedModules.includes(m.code) ? <Check className="w-3 h-3" /> : null}
                </div>
                <span className="text-xs">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t">
          <button onClick={handleSubmit} disabled={submitting}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {submitting ? 'Creando...' : 'Crear plan'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
