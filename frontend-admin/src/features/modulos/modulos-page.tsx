import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ToggleLeft, Building2, Loader2, Check, X, Flag,
  Plus, Edit3, Disc3, Percent,
} from 'lucide-react'
import { api } from '@/lib/api'
import type { Module, Tenant, FeatureFlag, CreateFeatureFlagRequest } from '@/types/admin'
import { Modal } from '@/components/ui/modal'

type Tab = 'modules' | 'feature-flags'

export function ModulosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('modules')

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Módulos y features</h1>
        <p className="text-sm text-neutral-500 mt-1">Gestión de módulos funcionales y feature flags del sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('modules')}
          className={`px-4 py-2.5 text-sm font-medium transition-all cursor-pointer border-b-2 -mb-px ${
            activeTab === 'modules'
              ? 'text-escriba-600 border-escriba-600 dark:text-escriba-400 dark:border-escriba-400'
              : 'text-neutral-500 dark:text-neutral-400 border-transparent hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-1.5" />
          Módulos por empresa
        </button>
        <button
          onClick={() => setActiveTab('feature-flags')}
          className={`px-4 py-2.5 text-sm font-medium transition-all cursor-pointer border-b-2 -mb-px ${
            activeTab === 'feature-flags'
              ? 'text-escriba-600 border-escriba-600 dark:text-escriba-400 dark:border-escriba-400'
              : 'text-neutral-500 dark:text-neutral-400 border-transparent hover:text-neutral-700 dark:hover:text-neutral-200'
          }`}
        >
          <Flag className="w-4 h-4 inline mr-1.5" />
          Feature Flags
        </button>
      </div>

      {activeTab === 'modules' && <ModulesTab />}
      {activeTab === 'feature-flags' && <FeatureFlagsTab />}
    </motion.div>
  )
}

/* =========================================================================
 * TAB 1: Módulos por empresa (existente)
 * ========================================================================= */
function ModulesTab() {
  const [modules, setModules] = useState<Module[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [tenantModules, setTenantModules] = useState<string[]>([])
  const [loadingModules, setLoadingModules] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/modules').then((r: any) => {
      const d = r?.data ?? r; setModules(Array.isArray(d) ? d : [])
      setLoadingModules(false)
    }).catch(() => setLoadingModules(false))
    api.get('/tenants', { page: '0', size: '200' }).then((r: any) => {
      const d = r?.data ?? r; setTenants(d?.content ?? d ?? [])
    }).catch(() => {})
  }, [])

  const loadTenantModules = (tenantId: string) => {
    setSelectedTenant(tenantId)
    setSaving(true)
    api.get(`/modules/by-company/${tenantId}`)
      .then((r: any) => {
        const d = r?.data ?? r
        setTenantModules(Array.isArray(d) ? d.map((tm: any) => tm.moduleCode) : [])
        setSaving(false)
      })
      .catch(() => setSaving(false))
  }

  const toggleModule = (code: string) => {
    setTenantModules(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const saveModules = async () => {
    if (!selectedTenant) return
    setSaving(true)
    try {
      await api.put(`/modules/by-company/${selectedTenant}`, tenantModules)
      alert('Módulos actualizados')
    } catch (err: any) { alert(err?.message || 'Error') }
    finally { setSaving(false) }
  }

  const categories = ['CORE', 'ADVANCED', 'PREMIUM'] as const
  const categoryLabels: Record<string, string> = { CORE: 'Básicos', ADVANCED: 'Avanzados', PREMIUM: 'Premium' }
  const categoryColors: Record<string, string> = {
    CORE: 'bg-escriba-50 dark:bg-escriba-900/20 border-escriba-200',
    ADVANCED: 'bg-info-50 dark:bg-blue-900/20 border-info-200',
    PREMIUM: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-5 h-5 text-neutral-400" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Módulos por empresa</h3>
        </div>

        <select value={selectedTenant} onChange={e => loadTenantModules(e.target.value)} className="input mb-4">
          <option value="">Seleccionar empresa...</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.businessName}</option>)}
        </select>

        {selectedTenant && !saving && (
          <div className="space-y-4">
            {categories.map(cat => {
              const catModules = modules.filter(m => m.category === cat)
              if (catModules.length === 0) return null
              return (
                <div key={cat} className={`rounded-xl border p-3 ${categoryColors[cat]}`}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">{categoryLabels[cat]}</h4>
                  <div className="space-y-1">
                    {catModules.map(m => {
                      const isActive = tenantModules.includes(m.code)
                      return (
                        <button key={m.code} onClick={() => toggleModule(m.code)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-all cursor-pointer ${
                            isActive ? 'bg-white dark:bg-neutral-800 shadow-sm' : 'opacity-60 hover:opacity-80'
                          }`}>
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${
                            isActive ? 'bg-escriba-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                          }`}>
                            {isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-neutral-400" />}
                          </div>
                          <span className="flex-1 text-left">{m.name}</span>
                          {m.isCore && <span className="text-[10px] text-escriba-500 font-medium">CORE</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            <button onClick={saveModules} disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ToggleLeft className="w-4 h-4" />}
              Guardar cambios
            </button>
          </div>
        )}
        {saving && selectedTenant && (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-escriba-500" /></div>
        )}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Catálogo de módulos ({modules.length})</h3>
        {loadingModules ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-escriba-500" /></div>
        ) : (
          <div className="space-y-1">
            {modules.map(m => (
              <div key={m.code} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{m.name}</p>
                  <p className="text-xs text-neutral-400">{m.code}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  m.category === 'CORE' ? 'bg-escriba-50 text-escriba-600' :
                  m.category === 'ADVANCED' ? 'bg-info-50 text-info-600' :
                  'bg-purple-50 text-purple-600'
                }`}>{m.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================================
 * TAB 2: Feature Flags
 * ========================================================================= */
function FeatureFlagsTab() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null)

  // Per-tenant override state
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [tenantFlags, setTenantFlags] = useState<string[]>([])
  const [savingTenant, setSavingTenant] = useState(false)

  const loadFlags = () => {
    setLoading(true)
    api.get('/feature-flags').then((r: any) => {
      const d = r?.data ?? r
      setFlags(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    loadFlags()
    api.get('/tenants', { page: '0', size: '200' }).then((r: any) => {
      const d = r?.data ?? r
      setTenants(d?.content ?? d ?? [])
    }).catch(() => {})
  }, [])

  const loadTenantFlags = (tenantId: string) => {
    setSelectedTenant(tenantId)
    setSavingTenant(true)
    api.get(`/feature-flags/by-company/${tenantId}`)
      .then((r: any) => {
        const d = r?.data ?? r
        setTenantFlags(Array.isArray(d) ? d.map((tf: any) => tf.flagCode) : [])
        setSavingTenant(false)
      })
      .catch(() => setSavingTenant(false))
  }

  const toggleTenantFlag = (code: string) => {
    setTenantFlags(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const saveTenantFlags = async () => {
    if (!selectedTenant) return
    setSavingTenant(true)
    try {
      await api.put(`/feature-flags/by-company/${selectedTenant}`, { enabledFlags: tenantFlags })
      alert('Feature flags actualizados para la empresa')
    } catch (err: any) { alert(err?.message || 'Error') }
    finally { setSavingTenant(false) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Global flags catalog */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Flag className="w-5 h-5 text-neutral-400" />
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Feature Flags globales ({flags.length})</h3>
          </div>
          <button onClick={() => { setEditingFlag(null); setShowCreateModal(true) }}
            className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-escriba-500" /></div>
        ) : flags.length === 0 ? (
          <p className="text-center text-neutral-400 py-8 text-sm">No hay feature flags configurados. Crea el primero.</p>
        ) : (
          <div className="space-y-2">
            {flags.map(flag => (
              <div key={flag.id} className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{flag.code}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      flag.defaultState === 'ACTIVE_FOR_ALL' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                      flag.defaultState === 'SPECIFIC_COMPANIES' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                      'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300'
                    }`}>
                      {flag.defaultState === 'ACTIVE_FOR_ALL' ? 'Activo global' :
                       flag.defaultState === 'SPECIFIC_COMPANIES' ? 'Por empresa' : 'Inactivo'}
                    </span>
                  </div>
                  {flag.description && (
                    <p className="text-xs text-neutral-400 mt-0.5">{flag.description}</p>
                  )}
                  {flag.rolloutPct != null && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-neutral-400">
                      <Percent className="w-3 h-3" />
                      Rollout: {flag.rolloutPct}%
                    </div>
                  )}
                </div>
                <button onClick={() => { setEditingFlag(flag); setShowCreateModal(true) }}
                  className="p-1.5 text-neutral-400 hover:text-escriba-600 hover:bg-escriba-50 rounded-lg transition-all cursor-pointer"
                  title="Editar">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <FeatureFlagModal
          isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); setEditingFlag(null) }}
          flag={editingFlag}
          onSaved={loadFlags}
        />
      </div>

      {/* Right: Per-tenant feature flag overrides */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-5 h-5 text-neutral-400" />
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Override por empresa</h3>
        </div>

        <p className="text-xs text-neutral-400 mb-4">
          Selecciona una empresa para activar/desactivar feature flags específicos.
          Los flags no configurados aquí heredan el valor global.
        </p>

        <select value={selectedTenant} onChange={e => loadTenantFlags(e.target.value)} className="input mb-4">
          <option value="">Seleccionar empresa...</option>
          {tenants.map(t => <option key={t.id} value={t.id}>{t.businessName}</option>)}
        </select>

        {selectedTenant && !savingTenant && flags.length > 0 && (
          <div className="space-y-1">
            {flags.map(flag => {
              const isActive = tenantFlags.includes(flag.code)
              return (
                <button key={flag.code} onClick={() => toggleTenantFlag(flag.code)}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-escriba-50 dark:bg-escriba-900/20 border border-escriba-200 dark:border-escriba-800'
                      : 'opacity-60 hover:opacity-80 border border-transparent'
                  }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${
                    isActive ? 'bg-escriba-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}>
                    {isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-neutral-400" />}
                  </div>
                  <span className="flex-1 text-left">{flag.code}</span>
                  {flag.description && (
                    <span className="text-[10px] text-neutral-400 truncate max-w-[120px]">{flag.description}</span>
                  )}
                </button>
              )
            })}
            <button onClick={saveTenantFlags} disabled={savingTenant}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50 cursor-pointer">
              {savingTenant ? <Loader2 className="w-4 h-4 animate-spin" /> : <ToggleLeft className="w-4 h-4" />}
              Guardar overrides
            </button>
          </div>
        )}

        {selectedTenant && savingTenant && (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-escriba-500" /></div>
        )}

        {selectedTenant && !savingTenant && flags.length === 0 && (
          <p className="text-center text-neutral-400 py-8 text-sm">No hay feature flags globales. Créalos primero.</p>
        )}
      </div>
    </div>
  )
}

/* =========================================================================
 * Feature Flag Create/Edit Modal
 * ========================================================================= */
function FeatureFlagModal({
  isOpen, onClose, flag, onSaved,
}: {
  isOpen: boolean
  onClose: () => void
  flag: FeatureFlag | null
  onSaved: () => void
}) {
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [defaultState, setDefaultState] = useState('INACTIVE')
  const [rolloutPct, setRolloutPct] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (flag) {
      setCode(flag.code)
      setDescription(flag.description || '')
      setDefaultState(flag.defaultState)
      setRolloutPct(flag.rolloutPct != null ? String(flag.rolloutPct) : '')
    } else {
      setCode('')
      setDescription('')
      setDefaultState('INACTIVE')
      setRolloutPct('')
    }
    setError(null)
  }, [flag, isOpen])

  const handleSave = async () => {
    setError(null)
    if (!code.trim()) { setError('El código es requerido'); return }
    if (!/^[a-z0-9_]+$/.test(code.trim())) { setError('Solo letras minúsculas, números y guión bajo'); return }

    setSaving(true)
    try {
      const body = {
        code: code.trim(),
        description: description.trim() || undefined,
        defaultState,
        rolloutPct: rolloutPct ? Number(rolloutPct) : undefined,
      }

      if (flag) {
        await api.put(`/feature-flags/${flag.id}`, {
          description: body.description,
          defaultState: body.defaultState,
          rolloutPct: body.rolloutPct,
        })
      } else {
        await api.post('/feature-flags', body as any)
      }
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={flag ? 'Editar feature flag' : 'Nuevo feature flag'}>
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Código</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            disabled={!!flag}
            placeholder="ej: bulk_discount_2025"
            className="input w-full"
          />
          <p className="text-[10px] text-neutral-400 mt-0.5">Solo minúsculas, números y guión bajo. No modificable después de crear.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe el propósito de este feature flag"
            className="input w-full min-h-[60px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Estado por defecto</label>
          <select value={defaultState} onChange={e => setDefaultState(e.target.value)} className="input w-full">
            <option value="INACTIVE">Inactivo — desactivado para todos</option>
            <option value="ACTIVE_FOR_ALL">Activo global — activado para todos</option>
            <option value="SPECIFIC_COMPANIES">Por empresa — activar manualmente</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Rollout % <span className="text-neutral-400 font-normal">(opcional)</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={rolloutPct}
            onChange={e => setRolloutPct(e.target.value)}
            placeholder="100"
            className="input w-full"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary cursor-pointer">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 cursor-pointer">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Disc3 className="w-4 h-4" />}
            {flag ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
