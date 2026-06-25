import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  DollarSign, Printer, ArrowLeft, Loader2, CheckCircle, AlertTriangle,
  X, Plus, Minus,
} from 'lucide-react';
import type { ApiResponse, CashSession } from '@/types';

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

export default function CashClosePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [cashWithdrawn, setCashWithdrawn] = useState(0);
  const [baseNext, setBaseNext] = useState(0);
  const [notes, setNotes] = useState('');
  const [useDirectTotal, setUseDirectTotal] = useState(false);
  const [directTotal, setDirectTotal] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  // Load open session
  const { data: sessionData } = useQuery({
    queryKey: ['open-session', user?.userId],
    queryFn: () => api.get<ApiResponse<CashSession>>('/cash/session/open', {
      params: { registerId: undefined, userId: user?.userId },
    }),
    enabled: !!user?.userId,
  });

  const session = sessionData?.data?.data;

  // Load sales summary
  const { data: salesData } = useQuery({
    queryKey: ['session-sales', session?.id],
    queryFn: () => api.get<ApiResponse<any>>(`/cash/session/${session!.id}/summary`),
    enabled: !!session?.id,
  });

  const totalSales = salesData?.data?.data?.totalSales || 0;
  const expectedCash = (session?.openingAmount || 0) + totalSales;

  // Calculate counted total
  const countedTotal = useDirectTotal
    ? directTotal
    : Object.entries(counts).reduce((sum, [val, qty]) => sum + Number(val) * qty, 0);

  const difference = countedTotal - expectedCash;

  // Auto-calculate base for next session
  useEffect(() => {
    if (baseNext === 0 && countedTotal > 0) {
      setBaseNext(Math.min(countedTotal, session?.openingAmount || 0));
    }
  }, [countedTotal]);

  const mutation = useMutation({
    mutationFn: () => api.post(`/cash/session/${session!.id}/close`, null, {
      params: {
        userId: user?.userId,
        countedAmount: countedTotal,
        closingDenominations: JSON.stringify(counts),
        cashWithdrawn,
        baseForNextSession: baseNext,
        notes,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['open-session'] });
      queryClient.invalidateQueries({ queryKey: ['session-sales'] });
      toast.success('Caja cerrada exitosamente');
      navigate('/pos');
    },
    onError: () => toast.error('Error al cerrar caja'),
  });

  if (!session) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-surface-400 p-12">
        <DollarSign size={64} className="mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-semibold mb-2">No hay sesión abierta</h2>
        <p className="mb-4">Debes abrir caja antes de poder cerrarla</p>
        <button onClick={() => navigate('/pos/apertura')} className="btn-primary">Abrir caja</button>
      </div>
    </div>
  );

  if (showConfirm) return (
    <div className="max-w-lg mx-auto mt-12 animate-fade-in">
      <div className="card p-8 text-center">
        <CheckCircle size={64} className="mx-auto mb-4 text-accent-500" />
        <h2 className="text-xl font-bold mb-2">Cierre completado</h2>
        <p className="text-surface-500 mb-6">El reporte de cierre se ha generado.</p>
        <div className="flex justify-center gap-3">
          <button className="btn-primary"><Printer size={16} /> Imprimir cierre</button>
          <button onClick={() => navigate('/pos/apertura')} className="btn-secondary">Nueva apertura</button>
        </div>
      </div>
    </div>
  );

  const diffAbs = Math.abs(difference);
  const isExact = difference === 0;
  const isShort = difference < 0;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/pos')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold">Cierre de caja</h1>
          <p className="text-surface-500 text-sm">Turno #{session.id ? session.id.slice(-4).toUpperCase() : ''}</p>
        </div>
      </div>

      {/* Session info */}
      <div className="card p-5 grid grid-cols-3 gap-4 text-sm">
        <div><span className="text-surface-400">Cajero:</span> <span className="font-medium">{user?.fullName}</span></div>
        <div><span className="text-surface-400">Apertura:</span> {new Date(session.openedAt).toLocaleString('es-CO')}</div>
        <div><span className="text-surface-400">Efectivo inicial:</span> <span className="font-medium">{formatCurrency(session.openingAmount)}</span></div>
      </div>

      {/* Sales summary by payment method */}
      <div className="card p-5">
        <h3 className="font-semibold mb-3">Resumen del turno</h3>
        <div className="space-y-2">
          <div className="flex justify-between py-1"><span>Ventas del turno</span><span className="font-medium">{formatCurrency(totalSales)}</span></div>
          <div className="flex justify-between py-1"><span>Efectivo inicial</span><span>{formatCurrency(session.openingAmount)}</span></div>
          <div className="border-t pt-2 flex justify-between font-semibold"><span>Efectivo esperado en caja</span><span className="text-primary-600 dark:text-primary-400">{formatCurrency(expectedCash)}</span></div>
        </div>
      </div>

      {/* Denomination count */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Conteo de efectivo</h3>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={useDirectTotal} onChange={e => setUseDirectTotal(e.target.checked)}
              className="rounded text-primary-500" />
            Ingresar total directamente
          </label>
        </div>

        {useDirectTotal ? (
          <input type="number" value={directTotal} onChange={e => setDirectTotal(Math.max(0, Number(e.target.value)))}
            className="input text-2xl font-bold text-center h-16" placeholder="0" />
        ) : (
          <div className="space-y-2">
            {DENOMINATIONS.map(denom => (
              <div key={denom.value} className="flex items-center gap-3 p-2 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                <span className="w-24 text-sm font-medium">{denom.label}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCounts(c => ({ ...c, [denom.value]: Math.max(0, (c[denom.value] || 0) - 1) }))}
                    className="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700"><Minus size={14} /></button>
                  <input type="number" value={counts[denom.value] || 0} min={0}
                    onChange={e => setCounts(c => ({ ...c, [denom.value]: Math.max(0, Number(e.target.value)) }))}
                    className="input w-16 text-center text-sm" />
                  <button onClick={() => setCounts(c => ({ ...c, [denom.value]: (c[denom.value] || 0) + 1 }))}
                    className="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700"><Plus size={14} /></button>
                </div>
                <span className="flex-1 text-right text-sm text-surface-500">
                  = {formatCurrency((counts[denom.value] || 0) * denom.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Difference */}
      <div className={cn('card p-5 border-2',
        isExact ? 'border-accent-300' : isShort ? 'border-red-300' : 'border-yellow-300')}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-surface-500">Total contado</p>
            <p className="text-2xl font-bold">{formatCurrency(countedTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-surface-500">Efectivo esperado</p>
            <p className="text-2xl font-bold">{formatCurrency(expectedCash)}</p>
          </div>
        </div>
        <div className={cn('mt-4 p-3 rounded-xl text-center',
          isExact ? 'bg-accent-50 dark:bg-accent-900/20' : 
          isShort ? 'bg-red-50 dark:bg-red-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20')}>
          <p className="text-sm mb-1">{isExact ? '✅ Cuadrado' : isShort ? '❌ Faltante' : '⚠️ Sobrante'}</p>
          <p className={cn('text-lg font-bold', isExact ? 'text-accent-600' : isShort ? 'text-red-600' : 'text-yellow-600')}>
            {isExact ? '$0' : `${isShort ? '-' : '+'}${formatCurrency(diffAbs)}`}
          </p>
        </div>
      </div>

      {/* Withdraw + Base */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Efectivo a retirar</label>
          <input type="number" value={cashWithdrawn} min={0} max={countedTotal}
            onChange={e => setCashWithdrawn(Math.min(countedTotal, Math.max(0, Number(e.target.value))))}
            className="input" />
          <p className="text-xs text-surface-400 mt-1">Máx: {formatCurrency(countedTotal)}</p>
        </div>
        <div>
          <label className="label">Base para siguiente turno</label>
          <input type="number" value={baseNext} min={0} max={countedTotal - cashWithdrawn}
            onChange={e => setBaseNext(Math.min(countedTotal - cashWithdrawn, Math.max(0, Number(e.target.value))))}
            className="input" />
          <p className="text-xs text-surface-400 mt-1">Máx: {formatCurrency(countedTotal - cashWithdrawn)}</p>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label">Observaciones de cierre</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Observaciones del cierre (opcional)..."
          className="input h-20 resize-none" maxLength={500} />
        {!isExact && diffAbs > 5000 && (
          <p className="text-xs text-red-500 mt-1">La diferencia supera el umbral de $5.000 — la observación es obligatoria</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <button onClick={() => navigate('/pos')} className="btn-secondary">Volver al POS</button>
        <button onClick={() => mutation.mutate()}
          disabled={countedTotal <= 0 || mutation.isPending}
          className={cn('btn-primary', !isExact && 'btn-danger')}>
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          Cerrar caja
        </button>
      </div>
    </div>
  );
}
