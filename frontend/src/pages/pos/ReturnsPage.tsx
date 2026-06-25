import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  RotateCcw, Search, ShoppingCart, X, Loader2, CheckCircle,
  ArrowLeft, Package, Receipt, AlertTriangle, DollarSign,
} from 'lucide-react';
import type { ApiResponse, PageResponse, Sale, SaleItem } from '@/types';

interface ReturnItem {
  saleItemId: string;
  productId: string;
  productName: string;
  originalQty: number;
  returnQty: number;
  unitPrice: number;
  subtotal: number;
}

const REFUND_TYPES = [
  { value: 'CASH', label: 'Devolución en efectivo', icon: DollarSign },
  { value: 'CREDIT_NOTE', label: 'Nota crédito', icon: Receipt },
  { value: 'NEXT_PURCHASE', label: 'Abono a próxima compra', icon: ShoppingCart },
];

export default function ReturnsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState('DEFECTIVE');
  const [reasonDesc, setReasonDesc] = useState('');
  const [refundType, setRefundType] = useState('CASH');
  const [showConfirm, setShowConfirm] = useState(false);

  // Search sales
  const { data: salesData } = useQuery({
    queryKey: ['returns-search', user?.companyId, search],
    queryFn: () =>
      api.get<ApiResponse<PageResponse<Sale>>>('/sales', {
        params: { companyId: user?.companyId, page: 0, size: 10 },
      }),
    enabled: search.length >= 2 && !!user?.companyId,
  });

  const sales = salesData?.data?.data?.content || [];

  const selectSale = (sale: Sale) => {
    setSelectedSale(sale);
    setReturnItems(sale.items?.map(item => ({
      saleItemId: item.id,
      productId: item.productId,
      productName: item.product?.name || 'Producto',
      originalQty: item.quantity,
      returnQty: 0,
      unitPrice: item.unitPrice,
      subtotal: item.total,
    })) || []);
    setSearch('');
  };

  const toggleItem = (saleItemId: string) => {
    setReturnItems(prev => prev.map(item =>
      item.saleItemId === saleItemId
        ? { ...item, returnQty: item.returnQty > 0 ? 0 : item.originalQty }
        : item
    ));
  };

  const updateQty = (saleItemId: string, qty: number) => {
    setReturnItems(prev => prev.map(item =>
      item.saleItemId === saleItemId
        ? { ...item, returnQty: Math.min(Math.max(0, qty), item.originalQty), subtotal: Math.min(Math.max(0, qty), item.originalQty) * item.unitPrice }
        : item
    ));
  };

  const selectedItems = returnItems.filter(i => i.returnQty > 0);
  const totalRefund = selectedItems.reduce((s, i) => s + i.subtotal, 0);
  const hasSelection = selectedItems.length > 0;

  const mutation = useMutation({
    mutationFn: () => api.post('/returns', {
      companyId: user?.companyId,
      saleId: selectedSale!.id,
      reason, reasonDescription: reasonDesc,
      refundType, total: totalRefund,
      items: selectedItems.map(i => ({
        saleItemId: i.saleItemId, productId: i.productId,
        quantity: i.returnQty, unitPrice: i.unitPrice, subtotal: i.subtotal,
      })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success(`Devolución procesada: ${totalRefund > 0 ? formatCurrency(totalRefund) : '$0'}`);
      setShowConfirm(true);
    },
    onError: () => toast.error('Error al procesar devolución'),
  });

  if (showConfirm) return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="card p-8 max-w-md text-center">
        <CheckCircle size={64} className="mx-auto mb-4 text-accent-500" />
        <h2 className="text-xl font-bold mb-2">Devolución procesada</h2>
        <p className="text-surface-500 mb-6">Se ha revertido el inventario correctamente.</p>
        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-6">{formatCurrency(totalRefund)}</p>
        <button onClick={() => { setShowConfirm(false); setSelectedSale(null); setReturnItems([]); }} className="btn-primary">
          Nueva devolución
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/pos')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold">Devoluciones</h1>
          <p className="text-surface-500 text-sm">Procesa la devolución de productos de una venta</p>
        </div>
      </div>

      {/* Step 1: Find sale */}
      {!selectedSale && (
        <div className="card p-6">
          <label className="label">Buscar venta original</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" placeholder="Busca por N° de venta, cliente o factura..."
              value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 h-12 text-base" autoFocus />
          </div>

          {search.length >= 2 && (
            <div className="mt-3 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
              {sales.length === 0 ? (
                <p className="p-4 text-sm text-surface-400 text-center">Sin resultados</p>
              ) : (
                sales.map(sale => (
                  <button key={sale.id} onClick={() => selectSale(sale)}
                    className="w-full flex items-center justify-between p-4 hover:bg-surface-50 dark:hover:bg-surface-800 
                             transition-colors border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <Receipt size={18} className="text-surface-400" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{sale.saleNumber}</p>
                        <p className="text-xs text-surface-400">{formatDate(sale.createdAt)} · {sale.customer?.name || 'CF'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(sale.total)}</p>
                      <p className="text-xs text-surface-400">{sale.items?.length || 0} productos</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {!search && (
            <div className="text-center py-12 text-surface-400">
              <RotateCcw size={48} className="mx-auto mb-3 opacity-30" />
              <p>Ingresa el número de venta o nombre del cliente</p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select items */}
      {selectedSale && (
        <>
          <div className="card p-4 flex items-center gap-4 text-sm">
            <span className="font-medium">{selectedSale.saleNumber}</span>
            <span className="text-surface-400">|</span>
            <span>{formatDate(selectedSale.createdAt)}</span>
            <span className="text-surface-400">|</span>
            <span>{selectedSale.customer?.name || 'Consumidor Final'}</span>
            <span className="text-surface-400">|</span>
            <span className="font-medium">{formatCurrency(selectedSale.total)}</span>
            <button onClick={() => setSelectedSale(null)} className="btn-ghost p-1 ml-auto text-surface-400">
              <X size={16} />
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-surface-200 dark:border-surface-800">
              <h3 className="font-semibold">Selecciona los productos a devolver</h3>
            </div>
            <div className="table-container border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="w-20">Original</th>
                    <th className="w-28">A devolver</th>
                    <th className="w-24">Precio</th>
                    <th className="w-24">Subtotal</th>
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {returnItems.map(item => (
                    <tr key={item.saleItemId} className={cn(item.returnQty > 0 && 'bg-accent-50/50 dark:bg-accent-900/10')}>
                      <td><p className="text-sm font-medium">{item.productName}</p></td>
                      <td className="text-center">{item.originalQty.toFixed(0)}</td>
                      <td>
                        <input type="number" value={item.returnQty} min={0} max={item.originalQty}
                          onChange={e => updateQty(item.saleItemId, Number(e.target.value))}
                          className={cn('input w-20 text-center', item.returnQty > 0 && 'border-accent-400')} />
                      </td>
                      <td className="text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                      <td className={cn('text-right font-medium', item.returnQty > 0 && 'text-accent-600')}>{formatCurrency(item.subtotal)}</td>
                      <td>
                        <button onClick={() => toggleItem(item.saleItemId)} className={cn('btn-ghost p-1 text-xs',
                          item.returnQty > 0 ? 'text-red-500' : 'text-accent-500')}>
                          {item.returnQty > 0 ? 'Quitar' : 'Seleccionar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reason & refund type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Motivo de devolución</label>
              <select value={reason} onChange={e => setReason(e.target.value)} className="input">
                <option value="DEFECTIVE">Producto defectuoso</option>
                <option value="WRONG_ITEM">No era lo que quería</option>
                <option value="CASHIER_ERROR">Equivocación del cajero</option>
                <option value="OTHER">Otro</option>
              </select>
              {reason === 'OTHER' && (
                <textarea value={reasonDesc} onChange={e => setReasonDesc(e.target.value)}
                  placeholder="Describe el motivo..." className="input mt-2 h-20 resize-none" />
              )}
            </div>

            <div>
              <label className="label">Forma de reembolso</label>
              <div className="space-y-2">
                {REFUND_TYPES.map(rt => (
                  <button key={rt.value} onClick={() => setRefundType(rt.value)}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-xl border-2 text-sm transition-all',
                      refundType === rt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-surface-200')}>
                    <rt.icon size={18} className={refundType === rt.value ? 'text-primary-500' : 'text-surface-400'} />
                    {rt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-400">Productos seleccionados: {selectedItems.length} de {returnItems.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-surface-400">Total a devolver</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalRefund)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pb-8">
            <button onClick={() => { setSelectedSale(null); setReturnItems([]); }} className="btn-secondary">Cancelar</button>
            <button onClick={() => mutation.mutate()}
              disabled={!hasSelection || mutation.isPending} className="btn-primary">
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              Procesar devolución
            </button>
          </div>
        </>
      )}
    </div>
  );
}
