import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Save, Store, Palette, Mail, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CompanyConfigPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: 'ESCRIBA DEMO S.A.S.', tradeName: 'ESCRIBA POS Demo',
    nit: '901123456-7', address: 'Cra 7 # 71-21 Torre A',
    phone: '6012345678', email: 'demo@escriba.co',
    primaryColor: '#131b2e', secondaryColor: '#5c5e68',
    smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '',
  });

  const tabs = [
    { id: 'general', label: 'Datos generales', icon: Store },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
    { id: 'smtp', label: 'Email (SMTP)', icon: Mail },
  ];

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Configuración guardada');
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Configuración de la empresa</h1>

      <div className="card">
        <div className="flex border-b border-surface-200">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px',
                tab === t.id ? 'border-primary-500 text-primary-600 dark:text-primary-300' : 'border-transparent text-surface-500 dark:text-surface-400')}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {tab === 'general' && (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">E</span>
                </div>
                <div>
                  <button className="btn-secondary text-sm"><Store size={14} /> Cambiar logo</button>
                  <p className="text-xs text-surface-400 mt-1">JPG/PNG/SVG · 200×60px · máx 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Razón social</label><input value={form.name} className="input" /></div>
                <div><label className="label">Nombre comercial</label><input value={form.tradeName} className="input" /></div>
                <div><label className="label">NIT</label><input value={form.nit} className="input bg-surface-50" readOnly /></div>
                <div className="col-span-2"><label className="label">Dirección fiscal</label><input value={form.address} className="input" /></div>
                <div><label className="label">Teléfono</label><input value={form.phone} className="input" /></div>
                <div><label className="label">Email corporativo</label><input value={form.email} className="input" /></div>
              </div>
            </>
          )}

          {tab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <label className="label">Color primario</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                  <span className="font-mono text-sm">{form.primaryColor}</span>
                  <div className="w-24 h-8 rounded-lg" style={{ backgroundColor: form.primaryColor }} />
                </div>
              </div>
              <div>
                <label className="label">Color secundario</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.secondaryColor} onChange={e => setForm({...form, secondaryColor: e.target.value})}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                  <span className="font-mono text-sm">{form.secondaryColor}</span>
                  <div className="w-24 h-8 rounded-lg" style={{ backgroundColor: form.secondaryColor }} />
                </div>
              </div>
              <div className="card p-4 bg-surface-50">
                <p className="text-xs text-surface-400 mb-2">Vista previa del tema</p>
                <div className="flex gap-2">
                  <button className="btn-primary" style={{ backgroundColor: form.primaryColor }}>Botón primario</button>
                  <button className="btn-secondary" style={{ borderColor: form.secondaryColor, color: form.secondaryColor }}>Botón secundario</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'smtp' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="label">Nombre del remitente</label><input placeholder="ESCRIBA - Mi Empresa" className="input" /></div>
                <div className="col-span-2"><label className="label">Email remitente</label><input placeholder="noreply@miempresa.co" className="input" /></div>
                <div><label className="label">Servidor SMTP</label><input placeholder="smtp.gmail.com" className="input" /></div>
                <div><label className="label">Puerto</label><input type="number" placeholder="587" className="input" /></div>
                <div><label className="label">Usuario</label><input className="input" /></div>
                <div><label className="label">Contraseña</label><input type="password" className="input" /></div>
              </div>
              <button className="btn-secondary"><Mail size={16} /> Probar envío</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar configuración
        </button>
      </div>
    </div>
  );
}
