import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Building2, User, FileText, Settings, Check, ChevronRight, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAdminAuthStore } from '@/stores/admin-auth-store'
import type { AdminRoleCode } from '@/types/admin'

function notify(msg: string) {
  alert(msg)
}

const TAX_REGIMES = [
  'Responsable de IVA', 'No responsable', 'Gran contribuyente', 'Régimen simple',
]
const DEPARTMENTS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó',
  'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira',
  'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo',
  'Quindío', 'Risaralda', 'San Andrés', 'Santander', 'Sucre', 'Tolima',
  'Valle del Cauca', 'Vaupés', 'Vichada',
]
const DURATIONS = [
  { value: 1, label: '1 mes' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '1 año' },
]

const STEPS = [
  { icon: Building2, label: 'Datos de la empresa', desc: 'Información básica y tributaria' },
  { icon: User, label: 'Admin principal', desc: 'Usuario administrador' },
  { icon: FileText, label: 'Plan y licencia', desc: 'Plan asignado y configuración' },
  { icon: Settings, label: 'Revisión', desc: 'Verificar datos antes de crear' },
]

export function EmpresaCreatePage() {
  const navigate = useNavigate()
  const { user } = useAdminAuthStore()
  const userRole = user?.role as AdminRoleCode
  const canWrite = userRole === 'SA' || userRole === 'AC'
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    personType: 'LEGAL',
    nit: '', dv: '', businessName: '', tradeName: '',
    taxRegime: '', ciiuCode: '', address: '', department: '', city: '',
    phone: '', email: '', website: '',
    adminFirstName: '', adminLastName: '', adminEmail: '', adminPhone: '', adminPassword: '',
    planId: 0, licenseType: 'TRIAL',
    licenseDuration: 3, autoRenew: true, notes: '',
    discountPct: 0, discountReason: '',
  })

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const startDate = new Date().toISOString().split('T')[0]
      await api.post('/tenants', {
        ...form,
        personType: form.personType || 'LEGAL',
        licenseStartDate: startDate,
        gracePeriodDays: 7,
        discountPct: form.discountPct || 0,
        timezone: 'America/Bogota',
      })
      notify('Empresa creada exitosamente')
      navigate('/empresas')
    } catch (err: any) {
      notify(err?.message || 'Error al crear empresa')
    } finally {
      setSubmitting(false)
    }
  }

  if (!canWrite) {
    return <div className="text-center py-16 text-neutral-500">No tienes permisos para crear empresas</div>
  }

  const canNext = () => {
    if (step === 0) return form.nit && form.businessName && form.email && form.taxRegime
    if (step === 1) return form.adminFirstName && form.adminLastName && form.adminEmail
    if (step === 2) return form.planId > 0 && form.licenseType
    return true
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/empresas" className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Crear nueva empresa</h1>
          <p className="text-sm text-neutral-500 mt-1">Registra una nueva empresa cliente en el sistema</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-4 gap-3">
        {STEPS.map((s, i) => {
          const isActive = i === step
          const isDone = i < step
          return (
            <button key={s.label} onClick={() => i < step && setStep(i)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isActive ? 'bg-escriba-50 dark:bg-escriba-900/20 border-escriba-200 dark:border-escriba-800 ring-1 ring-escriba-300' :
                isDone ? 'bg-success-50 dark:bg-green-900/20 border-success-200 dark:border-green-800 cursor-pointer' :
                'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 opacity-60'
              }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                isActive ? 'bg-escriba-600 text-white' :
                isDone ? 'bg-success-500 text-white' :
                'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
              }`}>
                {isDone ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{s.label}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{s.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-5">
        {step === 0 && (
          <>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Datos de la empresa</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Tipo de persona</label>
                <select value={form.personType} onChange={e => update('personType', e.target.value)} className="input">
                  <option value="LEGAL">Persona jurídica (NIT)</option>
                  <option value="NATURAL">Persona natural (CC)</option>
                </select>
              </div>
              <div><label className="label">NIT *</label><input value={form.nit} onChange={e => update('nit', e.target.value)} className="input" placeholder="900123456" /></div>
              <div><label className="label">DV</label><input value={form.dv} onChange={e => update('dv', e.target.value)} className="input" maxLength={2} placeholder="7" /></div>
              <div className="col-span-2"><label className="label">Razón social *</label><input value={form.businessName} onChange={e => update('businessName', e.target.value)} className="input" placeholder="Nombre legal de la empresa" /></div>
              <div className="col-span-2"><label className="label">Nombre comercial</label><input value={form.tradeName} onChange={e => update('tradeName', e.target.value)} className="input" placeholder="Nombre de marca (opcional)" /></div>
              <div><label className="label">Régimen tributario *</label>
                <select value={form.taxRegime} onChange={e => update('taxRegime', e.target.value)} className="input">
                  <option value="">Seleccionar...</option>
                  {TAX_REGIMES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><label className="label">CIIU</label><input value={form.ciiuCode} onChange={e => update('ciiuCode', e.target.value)} className="input" placeholder="4711" /></div>
              <div><label className="label">Departamento *</label>
                <select value={form.department} onChange={e => update('department', e.target.value)} className="input">
                  <option value="">Seleccionar...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="label">Ciudad *</label><input value={form.city} onChange={e => update('city', e.target.value)} className="input" placeholder="Ciudad" /></div>
              <div className="col-span-2"><label className="label">Dirección</label><input value={form.address} onChange={e => update('address', e.target.value)} className="input" placeholder="Dirección comercial" /></div>
              <div><label className="label">Teléfono</label><input value={form.phone} onChange={e => update('phone', e.target.value)} className="input" placeholder="+57 300 123 4567" /></div>
              <div><label className="label">Email *</label><input value={form.email} onChange={e => update('email', e.target.value)} className="input" placeholder="contacto@empresa.co" type="email" /></div>
              <div className="col-span-2"><label className="label">Sitio web</label><input value={form.website} onChange={e => update('website', e.target.value)} className="input" placeholder="https://..." /></div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Admin principal</h3>
            <p className="text-sm text-neutral-500">Usuario administrador de la empresa. Recibirá un email con instrucciones.</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div><label className="label">Nombres *</label><input value={form.adminFirstName} onChange={e => update('adminFirstName', e.target.value)} className="input" /></div>
              <div><label className="label">Apellidos *</label><input value={form.adminLastName} onChange={e => update('adminLastName', e.target.value)} className="input" /></div>
              <div className="col-span-2"><label className="label">Email *</label><input value={form.adminEmail} onChange={e => update('adminEmail', e.target.value)} className="input" type="email" /></div>
              <div><label className="label">Teléfono</label><input value={form.adminPhone} onChange={e => update('adminPhone', e.target.value)} className="input" /></div>
              <div><label className="label">Contraseña (auto si se deja vacío)</label><input value={form.adminPassword} onChange={e => update('adminPassword', e.target.value)} className="input" type="password" /></div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Plan y licencia</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="col-span-2"><label className="label">Plan *</label>
                <select value={form.planId} onChange={e => update('planId', Number(e.target.value))} className="input">
                  <option value={0}>Seleccionar plan...</option>
                  {/* Plans loaded from API will populate this */}
                </select>
              </div>
              <div><label className="label">Tipo de licencia *</label>
                <select value={form.licenseType} onChange={e => update('licenseType', e.target.value)} className="input">
                  <option value="TRIAL">Trial</option>
                  <option value="PAID">Paga</option>
                </select>
              </div>
              <div><label className="label">Duración</label>
                <select value={form.licenseDuration} onChange={e => update('licenseDuration', Number(e.target.value))} className="input">
                  {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="autoRenew" checked={form.autoRenew} onChange={e => update('autoRenew', e.target.checked)} className="rounded" />
                <label htmlFor="autoRenew" className="text-sm text-neutral-700 dark:text-neutral-300">Renovación automática</label>
              </div>
              <div><label className="label">Descuento %</label><input type="number" value={form.discountPct} onChange={e => update('discountPct', Number(e.target.value))} className="input" min={0} max={100} /></div>
              <div className="col-span-2"><label className="label">Notas</label><textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="input h-20 resize-none" /></div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Revisión final</h3>
            <p className="text-sm text-neutral-500">Verifica los datos antes de crear la empresa</p>
            <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
              <div><p className="text-xs text-neutral-400">Razón social</p><p className="text-sm font-medium">{form.businessName}</p></div>
              <div><p className="text-xs text-neutral-400">NIT</p><p className="text-sm font-medium">{form.nit}{form.dv ? `-${form.dv}` : ''}</p></div>
              <div><p className="text-xs text-neutral-400">Email</p><p className="text-sm font-medium">{form.email}</p></div>
              <div><p className="text-xs text-neutral-400">Régimen</p><p className="text-sm font-medium">{form.taxRegime}</p></div>
              <div><p className="text-xs text-neutral-400">Ubicación</p><p className="text-sm font-medium">{form.city}, {form.department}</p></div>
              <div><p className="text-xs text-neutral-400">Admin</p><p className="text-sm font-medium">{form.adminFirstName} {form.adminLastName}</p></div>
              <div><p className="text-xs text-neutral-400">Plan ID</p><p className="text-sm font-medium">{form.planId || '—'}</p></div>
              <div><p className="text-xs text-neutral-400">Licencia</p><p className="text-sm font-medium">{form.licenseType} · {form.licenseDuration} meses</p></div>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
            className="btn-secondary text-sm disabled:opacity-50">Anterior</button>
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canNext()}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {submitting ? 'Creando...' : 'Crear empresa'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
