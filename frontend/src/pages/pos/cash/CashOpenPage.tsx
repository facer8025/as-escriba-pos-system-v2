import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  DollarSign, ArrowLeft, Loader2, CheckCircle, Plus, Minus,
} from 'lucide-react';

const DENOMINATIONS = [
  { value: 100000, label: '$100.000' },
  { value: 50000, label: '$50.000' },
  { value: 20000, label: '$20.000' },
  { value: 10000, label: '$10.000' },
  { value: 5000, label: '$5.000' },
  { value: 2000, label: '$2.000' },
  { value: 1000, label: '$1.000' },
  { value: 500, label: '$500' },
  { value: 200, label: '$200' },
  { value: 100, label: '$100' },
];

export default function CashOpenPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [useDirect, setUseDirect] = useState(false);
  const [directAmount, setDirectAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const { data: registers } = useQuery({
    queryKey: ['registers', user?.companyId],
    queryFn: () => api.get('/cash/registers', { params: { companyId: user?.companyId } }),
    enabled: !!user?.companyId,
  });

  const [selectedRegister, setSelectedRegister] = useState('');

  const totalAmount = useDirect
    ? directAmount
    : Object.entries(counts).reduce((s, [v, q]) => s + Number(v) * q, 0);

  const mutation = useMutation({
    mutationFn: () => api.post('/cash/session/open', null, {
      params: {
        registerId: selectedRegister,
        userId: user?.userId,
        openingAmount: totalAmount,
        openingDenominations: JSON.stringify(counts),
        notes,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['open-session'] });
      toast.success('Caja abierta exitosamente');
      navigate('/pos');
    },
    onError: () => toast.error('Error al abrir caja'),
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/pos')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold">Apertura de caja</h1>
          <p className="text-surface-500 text-sm">Inicia tu turno registrando el efectivo inicial</p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="label">Caja</label>
          <select value={selectedRegister} onChange={e => setSelectedRegister(e.target.value)} className="input">
            <option value="">Selecciona caja...</option>
            {(registers?.data?.data || []).map((r: any) => (
              <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Cajero responsable</label>
          <input value={user?.fullName || ''} className="input bg-surface-50" readOnly />
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Efectivo inicial</h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={useDirect} onChange={e => setUseDirect(e.target.checked)}
              className="rounded text-primary-500" />
            Ingresar total directamente
          </label>
        </div>

        {useDirect ? (
          <input type="number" value={directAmount} min={0} onChange={e => setDirectAmount(Math.max(0, Number(e.target.value)))}
            className="input text-2xl font-bold text-center h-16" placeholder="0" />
        ) : (
          <div className="space-y-2">
            {DENOMINATIONS.map(d => (
              <div key={d.value} className="flex items-center gap-3 p-2 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                <span className="w-24 text-sm font-medium">{d.label}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCounts(c => ({ ...c, [d.value]: Math.max(0, (c[d.value]||0) - 1) }))}
                    className="p-1 rounded hover:bg-surface-200"><Minus size={14} /></button>
                  <input type="number" value={counts[d.value] || 0} min={0}
                    onChange={e => setCounts(c => ({ ...c, [d.value]: Math.max(0, Number(e.target.value)) }))}
                    className="input w-16 text-center text-sm" />
                  <button onClick={() => setCounts(c => ({ ...c, [d.value]: (c[d.value]||0) + 1 }))}
                    className="p-1 rounded hover:bg-surface-200"><Plus size={14} /></button>
                </div>
                <span className="flex-1 text-right text-sm text-surface-500">
                  = {formatCurrency((counts[d.value]||0) * d.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5 text-center">
        <p className="text-sm text-surface-400">Total efectivo inicial</p>
        <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(totalAmount)}</p>
      </div>

      <div>
        <label className="label">Observaciones</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Observaciones de apertura (opcional)..." className="input h-20 resize-none" maxLength={300} />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/pos')} className="btn-secondary">Cancelar</button>
        <button onClick={() => mutation.mutate()}
          disabled={!selectedRegister || totalAmount <= 0 || mutation.isPending} className="btn-primary">
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          Abrir caja
        </button>
      </div>
    </div>
  );
}
