import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { Store, Plus, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MOCK_BRANCHES = [
  { id: '1', code: 'BCG-01', name: 'Sucursal Principal - Bogotá', city: 'Bogotá D.C.', phone: '6012345678', active: true, registers: 2 },
  { id: '2', code: 'MED-01', name: 'Sucursal Medellín', city: 'Medellín', phone: '6041234567', active: true, registers: 1 },
];

export default function BranchesPage() {
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', city: '', phone: '', address: '' });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sucursales</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Nueva sucursal</button>
      </div>

      <div className="grid gap-4">
        {branches.map(b => (
          <div key={b.id} className="card-hover p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <Store size={20} className="text-primary-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{b.name}</h3>
                    <span className="badge-neutral text-[10px]">{b.code}</span>
                    <span className={cn('badge text-[10px]', b.active ? 'badge-success' : 'badge-neutral')}>
                      {b.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-sm text-surface-400 mt-0.5">{b.city} · {b.phone} · {b.registers} caja(s)</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content w-[500px] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4">Nueva sucursal</h3>
            <div className="space-y-3">
              <div><label className="label">Nombre</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Código</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="input" placeholder="BCG-02" /></div>
                <div><label className="label">Ciudad</label><input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="input" /></div>
              </div>
              <div><label className="label">Dirección</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input" /></div>
              <div><label className="label">Teléfono</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              <button onClick={() => { setBranches([...branches, { id: String(Date.now()), ...form, active: true, registers: 0 }]); setShowForm(false); toast.success('Sucursal creada'); }} className="btn-primary"><Save size={16} /> Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
