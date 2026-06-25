import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Camera, Save, Eye, EyeOff, Loader2, Moon, Sun, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.fullName?.split(' ')[0] || '',
    lastName: user?.fullName?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      {/* Photo */}
      <div className="card p-6 flex items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <button className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-surface-800 rounded-full border shadow-soft">
            <Camera size={14} />
          </button>
        </div>
        <div>
          <p className="font-semibold text-lg">{user?.fullName}</p>
          <p className="text-sm text-surface-400">{user?.roleName}</p>
        </div>
      </div>

      {/* Info */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold">Información personal</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Nombres</label><input value={form.firstName} className="input" /></div>
          <div><label className="label">Apellidos</label><input value={form.lastName} className="input" /></div>
          <div><label className="label">Correo electrónico</label><input value={form.email} className="input" /></div>
          <div><label className="label">Teléfono</label><input value={form.phone} placeholder="Agregar teléfono" className="input" /></div>
          <div><label className="label">Rol</label><input value={user?.roleName || ''} className="input bg-surface-50" readOnly /></div>
          <div><label className="label">Sucursal</label><input value={user?.branchName || 'No asignada'} className="input bg-surface-50" readOnly /></div>
        </div>
      </div>

      {/* Password */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold">Cambiar contraseña</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Contraseña actual</label><input type="password" className="input" /></div>
          <div><label className="label">Nueva contraseña</label><input type="password" className="input" /></div>
        </div>
      </div>

      {/* Preferences */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold">Preferencias de interfaz</h3>
        <div className="flex items-center gap-6">
          <span className="text-sm text-surface-500">Tema:</span>
          {[
            { value: 'light', label: 'Claro', icon: Sun },
            { value: 'dark', label: 'Oscuro', icon: Moon },
            { value: 'system', label: 'Sistema', icon: Monitor },
          ].map(opt => (
            <button key={opt.value} onClick={() => setTheme(opt.value as any)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
                theme === opt.value ? 'bg-primary-500 text-white shadow-soft dark:bg-primary-600 dark:text-white' : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800')}>
              <opt.icon size={16} /> {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => toast.success('Perfil actualizado')} className="btn-primary"><Save size={16} /> Guardar cambios</button>
      </div>
    </div>
  );
}
