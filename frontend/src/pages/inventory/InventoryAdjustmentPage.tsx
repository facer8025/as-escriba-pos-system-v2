import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Package, Save, Loader2, AlertTriangle, Search, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, Product, PageResponse } from '@/types';

type AdjustmentType = 'POSITIVE' | 'NEGATIVE' | 'DIRECT';

export default function InventoryAdjustmentPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('POSITIVE');
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState('ADJUSTMENT');
  const [notes, setNotes] = useState('');

  const { data: searchData } = useQuery({
    queryKey: ['adj-products-search', user?.companyId, search],
    queryFn: () => api.get<ApiResponse<PageResponse<Product>>>('/products', {
      params: { companyId: user?.companyId, search, page: 0, size: 10 },
    }),
    enabled: search.length >= 2 && !!user?.companyId,
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses', user?.companyId],
    queryFn: () => api.get<ApiResponse<any[]>>('/inventory/warehouses', { params: { companyId: user?.companyId } }),
    enabled: !!user?.companyId,
  });

  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const products = searchData?.data?.data?.content || [];

  const previewStock = selectedProduct ? (
    adjustmentType === 'DIRECT' ? quantity :
    adjustmentType === 'POSITIVE' ? selectedProduct.currentStock + quantity :
    selectedProduct.currentStock - quantity
  ) : 0;

  const mutation = useMutation({
    mutationFn: () => api.post('/inventory/adjustments', null, {
      params: {
        companyId: user?.companyId,
        productId: selectedProduct!.id,
        warehouseId: selectedWarehouse,
        adjustmentType,
        quantity: adjustmentType === 'DIRECT' ? quantity :
                 adjustmentType === 'POSITIVE' ? selectedProduct!.currentStock + quantity :
                 selectedProduct!.currentStock - quantity,
        reason,
        notes,
        userId: user?.userId,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      toast.success('Ajuste aplicado exitosamente');
      navigate('/inventario');
    },
    onError: () => toast.error('Error al aplicar ajuste'),
  });

  const canSubmit = selectedProduct && selectedWarehouse && (
    (adjustmentType === 'DIRECT' && quantity >= 0) ||
    (adjustmentType !== 'DIRECT' && quantity > 0)
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/inventario')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Ajuste de inventario</h1>
          <p className="text-surface-500 text-sm mt-1">Corrige el stock de un producto</p>
        </div>
      </div>

      {/* Select product */}
      <div className="card p-6">
        <label className="label">Producto</label>
        {selectedProduct ? (
          <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Package size={20} className="text-surface-400" />
              <div>
                <p className="font-medium text-surface-900 dark:text-white">{selectedProduct.name}</p>
                <p className="text-xs text-surface-400">Código: {selectedProduct.internalCode} · Stock actual: <strong>{selectedProduct.currentStock.toFixed(2)}</strong></p>
              </div>
            </div>
            <button onClick={() => { setSelectedProduct(null); setQuantity(0); }} className="p-1 text-surface-400 hover:text-red-500">
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input type="text" placeholder="Busca el producto a ajustar..." value={search}
                onChange={e => setSearch(e.target.value)} className="input pl-9 h-12" autoFocus />
            </div>
            {search.length >= 2 && (
              <div className="mt-2 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
                {products.map(p => (
                  <button key={p.id} onClick={() => { setSelectedProduct(p); setSearch(''); }}
                    className="w-full flex items-center justify-between p-3 hover:bg-surface-50 dark:hover:bg-surface-800 
                             transition-colors border-b border-surface-100 dark:border-surface-800 last:border-0">
                    <div className="text-left">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-surface-400">{p.internalCode}</p>
                    </div>
                    <div className="text-right text-sm">
                      <span className="font-medium">{p.currentStock.toFixed(0)}</span>
                      <span className="text-surface-400 ml-1">und</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedProduct && (
        <>
          {/* Warehouse */}
          <div className="card p-6">
            <label className="label">Bodega</label>
            <select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)} className="input">
              <option value="">Selecciona bodega...</option>
              {(warehouses?.data?.data || []).map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Adjustment type */}
          <div className="card p-6 space-y-4">
            <label className="label">Tipo de ajuste</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'POSITIVE', label: 'Entrada (suma)', color: 'text-accent-600 border-accent-300 hover:bg-accent-50' },
                { value: 'NEGATIVE', label: 'Salida (resta)', color: 'text-red-600 border-red-300 hover:bg-red-50' },
                { value: 'DIRECT', label: 'Valor directo', color: 'text-blue-600 border-blue-300 hover:bg-blue-50' },
              ].map(opt => (
                <button key={opt.value} onClick={() => { setAdjustmentType(opt.value as AdjustmentType); setQuantity(0); }}
                  className={cn('p-3 rounded-xl border-2 text-sm font-medium transition-all',
                    adjustmentType === opt.value ? `${opt.color} bg-opacity-10` : 'border-surface-200 text-surface-500')}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Quantity */}
            <div>
              <label className="label">
                {adjustmentType === 'DIRECT' ? 'Nuevo stock exacto' :
                 adjustmentType === 'POSITIVE' ? 'Cantidad a agregar' : 'Cantidad a retirar'}
              </label>
              <input type="number" value={quantity} min={0}
                onChange={e => setQuantity(Math.max(0, Number(e.target.value)))}
                className="input text-lg font-bold h-14 text-center" />
            </div>

            {/* Preview */}
            <div className={cn('p-4 rounded-xl text-center',
              previewStock < 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-surface-50 dark:bg-surface-800')}>
              <p className="text-sm text-surface-500 mb-1">El stock quedará en:</p>
              <p className={cn('text-2xl font-bold',
                previewStock < 0 ? 'text-red-600' : 'text-primary-600 dark:text-primary-400')}>
                {previewStock.toFixed(2)} unidades
              </p>
              {previewStock < 0 && (
                <p className="text-xs text-red-500 mt-1 flex items-center justify-center gap-1">
                  <AlertTriangle size={12} /> Stock negativo — verifica la cantidad
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="label">Motivo</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="input">
                <option value="ADJUSTMENT">Ajuste de inventario</option>
                <option value="DAMAGE">Daño / Deterioro</option>
                <option value="EXPIRATION">Vencimiento</option>
                <option value="THEFT">Robo / Hurto</option>
                <option value="COUNT_DIFFERENCE">Diferencia de conteo</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>

            <div>
              <label className="label">Observación</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Notas sobre el ajuste..." className="input h-20 resize-none" maxLength={300} />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pb-8">
            <button onClick={() => navigate('/inventario')} className="btn-secondary">Cancelar</button>
            <button onClick={() => mutation.mutate()} disabled={!canSubmit || mutation.isPending} className="btn-primary">
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Aplicar ajuste
            </button>
          </div>
        </>
      )}
    </div>
  );
}
