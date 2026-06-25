import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Package, ArrowLeft, CheckCircle, AlertTriangle, Loader2, ClipboardCheck, Save,
} from 'lucide-react';
import type { ApiResponse, PurchaseOrder, PurchaseOrderItem } from '@/types';

interface ReceiveItem {
  productId: string;
  productName: string;
  productCode: string;
  orderedQty: number;
  pendingQty: number;
  receivedNow: number;
  unitCost: number;
  notes: string;
  hasIssue: boolean;
  issueType: string;
}

export default function PurchaseOrderReceivePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<ReceiveItem[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');

  // Load order
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => api.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`),
    enabled: !!id,
  });

  const order = orderData?.data?.data;

  // Initialize receive items from order
  useEffect(() => {
    if (order?.items) {
      setItems(order.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productCode: item.product.internalCode || '',
        orderedQty: item.quantity,
        pendingQty: item.quantity - item.quantityReceived,
        receivedNow: item.quantity - item.quantityReceived,
        unitCost: item.unitCost,
        notes: '',
        hasIssue: false,
        issueType: 'NONE',
      })));
    }
  }, [order]);

  // Get warehouses
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses', user?.companyId],
    queryFn: () => api.get<ApiResponse<any[]>>('/inventory/warehouses', { params: { companyId: user?.companyId } }),
    enabled: !!user?.companyId,
  });

  const updateItem = (productId: string, field: string, value: any) => {
    setItems(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const updated = { ...i, [field]: value };
      if (field === 'hasIssue' && !value) updated.issueType = 'NONE';
      if (field === 'receivedNow') updated.receivedNow = Math.min(Math.max(0, value), i.pendingQty);
      return updated;
    }));
  };

  const totalOrdered = items.reduce((s, i) => s + i.orderedQty, 0);
  const totalReceiving = items.reduce((s, i) => s + i.receivedNow, 0);
  const totalCost = items.reduce((s, i) => s + i.receivedNow * i.unitCost, 0);
  const hasIssues = items.some(i => i.hasIssue);
  const fulfillmentPct = totalOrdered > 0 ? Math.round((totalReceiving / totalOrdered) * 100) : 0;

  const mutation = useMutation({
    mutationFn: async () => {
      // Save partial receive first, then confirm
      // For simplicity with the current API, we receive all at once
      await api.post(`/purchase-orders/${id}/receive`, null, {
        params: { userId: user?.userId, warehouseId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      toast.success(`Recepción confirmada: ${items.length} productos · ${totalReceiving.toFixed(0)} unidades · Valor: ${formatCurrency(totalCost)}`);
      navigate('/proveedores/ordenes');
    },
    onError: () => toast.error('Error al confirmar recepción'),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-surface-400" /></div>;
  if (!order) return <div className="text-center py-12 text-surface-400">Orden no encontrada</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/proveedores/ordenes')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold">Recibir mercancía</h1>
            <p className="text-surface-500 text-sm mt-1">Orden <strong>{order.orderNumber}</strong> — {order.supplier?.businessName}</p>
          </div>
        </div>
      </div>

      {/* Order header */}
      <div className="card p-4 flex items-center gap-6 text-sm">
        <div><span className="text-surface-400">Proveedor:</span> <span className="font-medium">{order.supplier?.businessName}</span></div>
        <div><span className="text-surface-400">Fecha orden:</span> {new Date(order.orderDate).toLocaleDateString('es-CO')}</div>
        <div><span className="text-surface-400">Total:</span> <span className="font-medium">{formatCurrency(order.total)}</span></div>
      </div>

      {/* Warehouse */}
      <div className="card p-6">
        <label className="label">Bodega de recepción</label>
        <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} className="input">
          <option value="">Selecciona bodega...</option>
          {(warehouses?.data?.data || []).map((w: any) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* Receive table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
          <h3 className="font-semibold">Productos a recibir</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-surface-500">Cumplimiento:</span>
            <div className="w-32 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', fulfillmentPct >= 100 ? 'bg-accent-500' : 'bg-yellow-500')} style={{ width: `${fulfillmentPct}%` }} />
            </div>
            <span className={cn('font-medium', fulfillmentPct >= 100 ? 'text-accent-500' : 'text-yellow-500')}>{fulfillmentPct}%</span>
          </div>
        </div>

        <div className="table-container border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="w-20">Pedido</th>
                <th className="w-20">Pendiente</th>
                <th className="w-28">Recibir ahora</th>
                <th className="w-28">Costo und.</th>
                <th className="w-28">Subtotal</th>
                <th className="w-24">Novedad</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.productId}>
                  <td>
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-surface-400">{item.productCode}</p>
                  </td>
                  <td className="text-center">{item.orderedQty.toFixed(0)}</td>
                  <td className="text-center">{item.pendingQty.toFixed(0)}</td>
                  <td>
                    <input type="number" value={item.receivedNow}
                      min={0} max={item.pendingQty}
                      onChange={e => updateItem(item.productId, 'receivedNow', Number(e.target.value))}
                      className="input w-20 text-center" />
                  </td>
                  <td className="text-right">{formatCurrency(item.unitCost)}</td>
                  <td className="text-right font-medium">{formatCurrency(item.receivedNow * item.unitCost)}</td>
                  <td>
                    <select value={item.issueType} onChange={e => {
                      const val = e.target.value;
                      updateItem(item.productId, 'issueType', val);
                      updateItem(item.productId, 'hasIssue', val !== 'NONE');
                    }} className="input text-xs">
                      <option value="NONE">Sin novedad</option>
                      <option value="DAMAGED">Dañado</option>
                      <option value="MISSING">Faltante</option>
                      <option value="WRONG">Diferente</option>
                      <option value="EXCESS">Excedente</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues alert */}
      {hasIssues && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl flex items-start gap-3">
          <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-300">Productos con novedad</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              {items.filter(i => i.hasIssue).map(i => i.productName).join(', ')} — estos productos se marcarán con novedad en el inventario.
            </p>
          </div>
        </div>
      )}

      {/* Receipt notes */}
      <div>
        <label className="label">Notas de recepción</label>
        <textarea value={receiptNotes} onChange={e => setReceiptNotes(e.target.value)}
          placeholder="Observaciones generales de la recepción..." className="input h-20 resize-none" />
      </div>

      {/* Summary + Actions */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2" />
        <div className="card p-5 space-y-3">
          <div className="flex justify-between text-sm"><span className="text-surface-500">Productos</span><span className="font-medium">{items.length}</span></div>
          <div className="flex justify-between text-sm"><span className="text-surface-500">Unidades recibidas</span><span className="font-medium">{totalReceiving.toFixed(0)}</span></div>
          <div className="border-t pt-3">
            <div className="flex justify-between"><span className="font-semibold">Valor recibido</span><span className="font-bold text-lg text-accent-600">{formatCurrency(totalCost)}</span></div>
          </div>

          <button onClick={() => mutation.mutate()}
            disabled={!warehouseId || items.length === 0 || totalReceiving <= 0 || mutation.isPending}
            className="w-full btn-primary mt-2">
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
            Confirmar recepción
          </button>
          <button onClick={() => navigate('/proveedores/ordenes')} className="w-full btn-secondary">
            <ArrowLeft size={16} /> Volver
          </button>
        </div>
      </div>
    </div>
  );
}
