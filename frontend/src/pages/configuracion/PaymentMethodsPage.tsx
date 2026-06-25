import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CreditCard, DollarSign, Smartphone, Building2, Save, ChevronDown, ChevronUp, User } from 'lucide-react';
import toast from 'react-hot-toast';

const METHODS = [
  { id: 'CASH', label: 'Efectivo', icon: DollarSign, alwaysOn: true },
  { id: 'DEBIT', label: 'Tarjeta Débito', icon: CreditCard },
  { id: 'CREDIT', label: 'Tarjeta Crédito', icon: CreditCard },
  { id: 'NEQUI', label: 'Nequi', icon: Smartphone },
  { id: 'DAVIPLATA', label: 'Daviplata', icon: Smartphone },
  { id: 'TRANSFER', label: 'Transferencia bancaria', icon: Building2 },
  { id: 'CREDIT_ACCOUNT', label: 'A crédito (cartera)', icon: User },
];

export default function PaymentMethodsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    CASH: true, DEBIT: true, CREDIT: true, NEQUI: true, DAVIPLATA: false, TRANSFER: true, CREDIT_ACCOUNT: false,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Medios de pago</h1>
      <p className="text-surface-500 -mt-4">Configura los medios de pago disponibles en el POS</p>

      <div className="space-y-3">
        {METHODS.map(m => {
          const Icon = m.icon;
          const isExpanded = expanded === m.id;
          return (
            <div key={m.id} className={cn('card overflow-hidden transition-all', enabled[m.id] && 'border-primary-200')}>
              <div className="p-4 flex items-center gap-4">
                <div className={cn('p-2 rounded-lg', enabled[m.id] ? 'bg-primary-50' : 'bg-surface-100')}>
                  <Icon size={20} className={enabled[m.id] ? 'text-primary-500' : 'text-surface-400'} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{m.label}</p>
                  {m.alwaysOn && <p className="text-xs text-surface-400">Siempre habilitado</p>}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={enabled[m.id]}
                    onChange={e => setEnabled({...enabled, [m.id]: e.target.checked})}
                    disabled={m.alwaysOn} className="sr-only peer" />
                  <div className="w-10 h-5 bg-surface-300 rounded-full peer-checked:bg-primary-500 
                    peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                    after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
                <button onClick={() => setExpanded(isExpanded ? null : m.id)} className="btn-ghost p-1">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t pt-3 space-y-3">
                  {m.id === 'DEBIT' && (
                    <><div><label className="label">Red de pago</label><select className="input"><option>Redeban</option><option>Credibanco</option></select></div>
                    <div><label className="label">N° de terminal (TID)</label><input className="input" /></div></>
                  )}
                  {m.id === 'NEQUI' && (
                    <><div><label className="label">Número Nequi</label><input placeholder="3001234567" className="input" /></div></>
                  )}
                  {m.id === 'TRANSFER' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="label">Banco</label><input className="input" /></div>
                      <div><label className="label">N° cuenta</label><input className="input" /></div>
                      <div><label className="label">Titular</label><input className="input" /></div>
                      <div><label className="label">Tipo</label><select className="input"><option>Ahorros</option><option>Corriente</option></select></div>
                    </div>
                  )}
                  {m.id === 'CREDIT_ACCOUNT' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="label">Límite por defecto</label><input type="number" className="input" /></div>
                      <div><label className="label">Días de plazo</label><input type="number" className="input" /></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button onClick={() => toast.success('Configuración guardada')} className="btn-primary"><Save size={16} /> Guardar</button>
      </div>
    </div>
  );
}
