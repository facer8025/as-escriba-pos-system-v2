import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Loader2, Save, Mail, Globe,
  Shield, CreditCard, FileText,
} from 'lucide-react'
import { api } from '@/lib/api'

type TabId = 'sistema' | 'dian' | 'pagos' | 'seguridad' | 'smtp'

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'sistema', label: 'Parámetros del sistema', icon: <Settings className="w-4 h-4" /> },
  { id: 'dian', label: 'Proveedores DIAN', icon: <FileText className="w-4 h-4" /> },
  { id: 'pagos', label: 'Pasarelas de pago', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'seguridad', label: 'Política de seguridad', icon: <Shield className="w-4 h-4" /> },
  { id: 'smtp', label: 'SMTP global', icon: <Mail className="w-4 h-4" /> },
]

export function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabId>('sistema')
  const [configs, setConfigs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const defaultConfigs: Record<string, { label: string; type: string; tab: TabId }> = {
    maintenance_mode: { label: 'Modo mantenimiento', type: 'boolean', tab: 'sistema' },
    maintenance_message: { label: 'Mensaje de mantenimiento', type: 'text', tab: 'sistema' },
    default_grace_period_days: { label: 'Días de gracia (default)', type: 'number', tab: 'sistema' },
    default_trial_duration_days: { label: 'Duración trial (días)', type: 'number', tab: 'sistema' },
    client_portal_url: { label: 'URL del portal cliente', type: 'text', tab: 'sistema' },
    support_email: { label: 'Email de soporte', type: 'email', tab: 'sistema' },
    audit_log_retention_days: { label: 'Retención logs auditoría (días)', type: 'number', tab: 'sistema' },
    work_hours_start: { label: 'Inicio jornada laboral', type: 'text', tab: 'sistema' },
    work_hours_end: { label: 'Fin jornada laboral', type: 'text', tab: 'sistema' },
    // Security
    jwt_admin_expiration_hours: { label: 'Expiración JWT admin (horas)', type: 'number', tab: 'seguridad' },
    max_login_attempts: { label: 'Máx. intentos de login', type: 'number', tab: 'seguridad' },
    totp_required: { label: '2FA obligatorio', type: 'boolean', tab: 'seguridad' },
    session_timeout_minutes: { label: 'Timeout de sesión (minutos)', type: 'number', tab: 'seguridad' },
    password_min_length: { label: 'Longitud mínima contraseña', type: 'number', tab: 'seguridad' },
    // SMTP
    smtp_host: { label: 'Host SMTP', type: 'text', tab: 'smtp' },
    smtp_port: { label: 'Puerto SMTP', type: 'number', tab: 'smtp' },
    smtp_username: { label: 'Usuario SMTP', type: 'text', tab: 'smtp' },
    smtp_from_email: { label: 'Email remitente', type: 'email', tab: 'smtp' },
    smtp_encryption: { label: 'Encriptación (TLS/SSL)', type: 'text', tab: 'smtp' },
    // Payment
    default_payment_terms_days: { label: 'Plazo de pago default (días)', type: 'number', tab: 'pagos' },
  }

  useEffect(() => {
    setLoading(true)
    api.get('/config/system').then((r: any) => {
      const d = r?.data ?? r
      setConfigs(d || {})
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/config/system', configs)
      alert('Configuración guardada')
    } catch (err: any) { alert(err?.message || 'Error') }
    finally { setSaving(false) }
  }

  const visibleConfigs = Object.entries(defaultConfigs).filter(([_, v]) => v.tab === activeTab)

  if (loading) {
    return (
      <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-escriba-500" /></div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Configuración global</h1>
        <p className="text-sm text-neutral-500 mt-1">Parámetros del sistema, proveedores y políticas de seguridad</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-escriba-600 text-escriba-600'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
        {activeTab === 'dian' ? (
          <DianProvidersSection />
        ) : activeTab === 'pagos' ? (
          <PaymentGatewaysSection />
        ) : (
          <div className="space-y-4">
            {visibleConfigs.length === 0 ? (
              <p className="text-sm text-neutral-400">No hay parámetros en esta sección</p>
            ) : (
              visibleConfigs.map(([key, field]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'boolean' ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={configs[key] === 'true'}
                        onChange={e => setConfigs(prev => ({ ...prev, [key]: String(e.target.checked) }))}
                        className="w-4 h-4 rounded border-neutral-300 text-escriba-600" />
                      <span className="text-sm text-neutral-500">
                        {configs[key] === 'true' ? 'Activado' : 'Desactivado'}
                      </span>
                    </label>
                  ) : (
                    <input type={field.type} value={configs[key] || ''}
                      onChange={e => setConfigs(prev => ({ ...prev, [key]: e.target.value }))}
                      className="input w-full" />
                  )}
                </div>
              ))
            )}
            <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <button onClick={handleSave} disabled={saving}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 cursor-pointer">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar cambios
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function DianProvidersSection() {
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)

  useEffect(() => {
    api.get('/config/dian-providers').then((r: any) => {
      const d = r?.data ?? r
      setProviders(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>

  return (
    <div>
      {providers.length === 0 ? (
        <p className="text-sm text-neutral-400">No hay proveedores DIAN configurados</p>
      ) : (
        <div className="space-y-2">
          {providers.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-neutral-400">{p.apiUrl} · {p.authType}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${p.active ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-500'}`}>
                {p.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PaymentGatewaysSection() {
  const [gateways, setGateways] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/config/payment-gateways').then((r: any) => {
      const d = r?.data ?? r
      setGateways(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>

  return (
    <div>
      {gateways.length === 0 ? (
        <p className="text-sm text-neutral-400">No hay pasarelas de pago configuradas</p>
      ) : (
        <div className="space-y-2">
          {gateways.map((g: any) => (
            <div key={g.id} className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50">
              <div>
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-xs text-neutral-400">Código: {g.code} · Comisión: {g.commissionPct}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${g.active ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-500'}`}>
                {g.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
