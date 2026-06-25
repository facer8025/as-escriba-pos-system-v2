import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Save, Loader2, RotateCcw, Shield, Boxes, ShoppingCart, DollarSign, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const PARAM_CATEGORIES = [
  {
    id: 'security', label: 'Seguridad', icon: Shield,
    params: [
      { key: 'max_login_attempts', label: 'Intentos de login antes de bloquear', value: '5', type: 'number' },
      { key: 'block_duration_minutes', label: 'Minutos de bloqueo', value: '30', type: 'number' },
      { key: 'session_timeout_minutes', label: 'Timeout de sesión (minutos)', value: '60', type: 'number' },
      { key: 'force_password_change_days', label: 'Forzar cambio de contraseña (días)', value: '0', type: 'number' },
    ],
  },
  {
    id: 'inventory', label: 'Inventario', icon: Boxes,
    params: [
      { key: 'stock_alert_days', label: 'Días para alerta de agotamiento', value: '7', type: 'number' },
      { key: 'costing_method', label: 'Método de costeo', value: 'WEIGHTED_AVERAGE', type: 'select', options: ['WEIGHTED_AVERAGE', 'FIFO'] },
      { key: 'allow_negative_stock', label: 'Permitir stock negativo', value: 'false', type: 'boolean' },
    ],
  },
  {
    id: 'sales', label: 'Ventas y POS', icon: ShoppingCart,
    params: [
      { key: 'cashier_max_discount_pct', label: '% máximo descuento para cajero', value: '10', type: 'number' },
      { key: 'admin_max_discount_pct', label: '% máximo descuento para admin', value: '50', type: 'number' },
      { key: 'require_customer_for_invoice', label: 'Exigir cliente para factura', value: 'true', type: 'boolean' },
      { key: 'pos_auto_redirect_seconds', label: 'Segundos para redirigir tras venta', value: '15', type: 'number' },
    ],
  },
  {
    id: 'tax', label: 'Impuestos', icon: DollarSign,
    params: [
      { key: 'default_vat_rate', label: 'Tarifa IVA predeterminada (%)', value: '19', type: 'number' },
      { key: 'price_includes_vat', label: 'Precios incluyen IVA', value: 'true', type: 'boolean' },
      { key: 'show_vat_on_ticket', label: 'Mostrar IVA desglosado en ticket', value: 'true', type: 'boolean' },
    ],
  },
];

export default function SystemParamsPage() {
  const [activeCategory, setActiveCategory] = useState('security');
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const category = PARAM_CATEGORIES.find(c => c.id === activeCategory)!;
  const getVal = (key: string, def: string) => values[key] ?? def;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Parámetros del sistema</h1>

      <div className="flex gap-6">
        {/* Category sidebar */}
        <div className="w-56 space-y-1">
          {PARAM_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeCategory === cat.id
                  ? 'bg-primary-500 text-white shadow-soft dark:bg-primary-600 dark:text-white'
                  : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800')}>
              <cat.icon size={18} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Parameters */}
        <div className="flex-1 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><category.icon size={18} /> {category.label}</h3>
            <button onClick={() => { setValues({}); toast.success('Valores restablecidos'); }}
              className="btn-ghost text-sm text-surface-400"><RotateCcw size={14} /> Restablecer por defecto</button>
          </div>

          <div className="space-y-4">
            {category.params.map(p => (
              <div key={p.key}>
                <label className="label">{p.label}</label>
                {p.type === 'boolean' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={getVal(p.key, p.value) === 'true'}
                      onChange={e => setValues({...values, [p.key]: e.target.checked ? 'true' : 'false'})}
                      className="rounded text-primary-500" />
                    <span className="text-sm">{getVal(p.key, p.value) === 'true' ? 'Activado' : 'Desactivado'}</span>
                  </label>
                ) : p.type === 'select' ? (
                  <select value={getVal(p.key, p.value)} onChange={e => setValues({...values, [p.key]: e.target.value})} className="input">
                    {p.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="number" value={getVal(p.key, p.value)} onChange={e => setValues({...values, [p.key]: e.target.value})} className="input" />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t">
            <button onClick={() => { setSaving(true); setTimeout(() => { setSaving(false); toast.success('Parámetros guardados'); }, 800); }}
              disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Guardar parámetros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
