import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Settings, Shield, Plus, Save, Loader2, AlertTriangle,
  CheckCircle, X, Link2, Upload,
} from 'lucide-react';
import type { ApiResponse } from '@/types';

interface Resolution {
  id: string;
  documentType: string;
  prefix: string;
  resolutionNumber: string;
  resolutionDate: string;
  startNumber: number;
  endNumber: number;
  currentNumber: number;
  expirationDate: string;
  active: boolean;
}

export default function DianConfigPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('emitter');
  const [showNewResolution, setShowNewResolution] = useState(false);
  const [newRes, setNewRes] = useState({
    documentType: 'INVOICE', prefix: 'FV', resolutionNumber: '',
    resolutionDate: '', startNumber: 1, endNumber: 1000,
    currentNumber: 1, expirationDate: '', active: true,
  });

  // Load resolutions
  const { data: resolutionsData } = useQuery({
    queryKey: ['resolutions', user?.companyId],
    queryFn: () => api.get<ApiResponse<Resolution[]>>('/invoices/resolutions', { params: { companyId: user?.companyId } }),
    enabled: !!user?.companyId,
  });

  const resolutions = resolutionsData?.data?.data || [];
  const remaining = resolutions.reduce((s, r) => s + Math.max(0, r.endNumber - r.currentNumber + 1), 0);

  const mutation = useMutation({
    mutationFn: () => api.post('/invoices/resolutions', {
      ...newRes,
      company: { id: user?.companyId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resolutions'] });
      toast.success('Resolución agregada');
      setShowNewResolution(false);
    },
    onError: () => toast.error('Error al crear resolución'),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Configuración DIAN</h1>
        <p className="text-surface-500 text-sm mt-1">Configura los parámetros de facturación electrónica</p>
      </div>

      {/* Sections tabs */}
      <div className="card">
        <div className="flex border-b border-surface-200">
          {[
            { id: 'emitter', label: 'Datos del emisor', icon: Shield },
            { id: 'provider', label: 'Proveedor tecnológico', icon: Link2 },
            { id: 'resolutions', label: `Resoluciones (${resolutions.length})`, icon: Plus },
          ].map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={cn('flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all',
                activeSection === s.id ? 'border-primary-500 text-primary-600 dark:text-primary-300' : 'border-transparent text-surface-500 dark:text-surface-400')}>
              <s.icon size={16} /> {s.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Emitter Data */}
          {activeSection === 'emitter' && (
            <div className="space-y-4">
              <p className="text-sm text-surface-500">Datos fiscales del emisor (tomados de la configuración de la empresa)</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">NIT</label><input type="text" value="901123456-7" className="input bg-surface-50" readOnly /></div>
                <div><label className="label">Razón social</label><input type="text" value="ESCRIBA DEMO S.A.S." className="input bg-surface-50" readOnly /></div>
                <div><label className="label">Régimen tributario</label><input type="text" value="Responsable de IVA" className="input bg-surface-50" readOnly /></div>
                <div><label className="label">Actividad económica (CIIU)</label><input type="text" value="4711" className="input bg-surface-50" readOnly /></div>
                <div className="col-span-2"><label className="label">Dirección fiscal</label><input type="text" value="Cra 7 # 71-21 Torre A, Bogotá" className="input bg-surface-50" readOnly /></div>
              </div>
            </div>
          )}

          {/* Provider */}
          {activeSection === 'provider' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Proveedor tecnológico</label>
                  <select className="input">
                    <option value="FACTUS">Factus</option>
                    <option value="ALANUBE">Alanube</option>
                    <option value="PLEMSI">Plemsi</option>
                    <option value="ALEGRA">Alegra</option>
                  </select>
                </div>
                <div>
                  <label className="label">Ambiente</label>
                  <select className="input">
                    <option value="SANDBOX">🧪 Pruebas (Sandbox)</option>
                    <option value="PRODUCTION">🚀 Producción</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">API Key / Token</label>
                  <input type="password" value="••••••••••••••••" className="input" />
                </div>
              </div>
              <button className="btn-secondary"><Link2 size={16} /> Probar conexión</button>
            </div>
          )}

          {/* Resolutions */}
          {activeSection === 'resolutions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-surface-500">
                  {resolutions.length} resoluciones · {remaining} números disponibles
                </p>
                <button onClick={() => setShowNewResolution(true)} className="btn-primary"><Plus size={16} /> Agregar resolución</button>
              </div>

              {/* Low numbers alert */}
              {remaining > 0 && remaining < 100 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-xl flex items-center gap-2 text-sm">
                  <AlertTriangle size={16} className="text-yellow-500" />
                  <span className="text-yellow-700 dark:text-yellow-300">Quedan menos de 100 números disponibles. Agrega una nueva resolución.</span>
                </div>
              )}

              {/* Resolutions table */}
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Prefijo</th>
                      <th>Tipo</th>
                      <th>N° Resolución</th>
                      <th>Desde</th>
                      <th>Hasta</th>
                      <th>Actual</th>
                      <th>Vence</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolutions.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-8 text-surface-400">Sin resoluciones configuradas</td></tr>
                    ) : (
                      resolutions.map(r => (
                        <tr key={r.id}>
                          <td className="font-mono font-bold">{r.prefix || '—'}</td>
                          <td><span className="badge-neutral">{r.documentType}</span></td>
                          <td className="font-mono text-xs">{r.resolutionNumber}</td>
                          <td className="text-center">{r.startNumber}</td>
                          <td className="text-center">{r.endNumber}</td>
                          <td className="text-center font-medium">{r.currentNumber}</td>
                          <td className="text-sm">{formatDate(r.expirationDate)}</td>
                          <td><span className={cn('badge', r.active ? 'badge-success' : 'badge-neutral')}>{r.active ? 'Activa' : 'Inactiva'}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* New resolution modal */}
              {showNewResolution && (
                <div className="modal-overlay" onClick={() => setShowNewResolution(false)}>
                  <div className="modal-content w-[500px] p-6" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold">Nueva resolución DIAN</h3>
                      <button onClick={() => setShowNewResolution(false)} className="btn-ghost p-1"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="label">Tipo de documento</label>
                        <select value={newRes.documentType} onChange={e => setNewRes({...newRes, documentType: e.target.value})} className="input">
                          <option value="INVOICE">Factura de venta</option>
                          <option value="CREDIT_NOTE">Nota crédito</option>
                          <option value="DEBIT_NOTE">Nota débito</option>
                          <option value="POS_EQUIVALENT">Documento equivalente POS</option>
                        </select>
                      </div>
                      <div><label className="label">Prefijo</label><input type="text" value={newRes.prefix} onChange={e => setNewRes({...newRes, prefix: e.target.value})} className="input" maxLength={4} /></div>
                      <div><label className="label">N° Resolución</label><input type="text" value={newRes.resolutionNumber} onChange={e => setNewRes({...newRes, resolutionNumber: e.target.value})} className="input" /></div>
                      <div><label className="label">Fecha resolución</label><input type="date" value={newRes.resolutionDate} onChange={e => setNewRes({...newRes, resolutionDate: e.target.value})} className="input" /></div>
                      <div><label className="label">Vence</label><input type="date" value={newRes.expirationDate} onChange={e => setNewRes({...newRes, expirationDate: e.target.value})} className="input" /></div>
                      <div><label className="label">N° inicial</label><input type="number" value={newRes.startNumber} onChange={e => setNewRes({...newRes, startNumber: Number(e.target.value)})} className="input" /></div>
                      <div><label className="label">N° final</label><input type="number" value={newRes.endNumber} onChange={e => setNewRes({...newRes, endNumber: Number(e.target.value)})} className="input" /></div>
                      <div><label className="label">Próximo número</label><input type="number" value={newRes.currentNumber} onChange={e => setNewRes({...newRes, currentNumber: Number(e.target.value)})} className="input" /></div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setShowNewResolution(false)} className="btn-secondary">Cancelar</button>
                      <button onClick={() => mutation.mutate()} disabled={!newRes.resolutionNumber || mutation.isPending} className="btn-primary">
                        {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
