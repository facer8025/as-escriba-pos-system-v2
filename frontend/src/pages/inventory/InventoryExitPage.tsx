import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Package, Search, X, Save, ArrowLeft, MinusCircle,
  Loader2, AlertTriangle, Barcode,
} from 'lucide-react';
import type { ApiResponse, Product, PageResponse } from '@/types';

interface ExitItem {
  productId: string;
  productName: string;
  productCode: string;
  currentStock: number;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

const EXIT_REASONS = [
  { value: 'DAMAGE', label: 'Daño / Deterioro' },
  { value: 'EXPIRATION', label: 'Vencimiento' },
  { value: 'THEFT', label: 'Robo / Hurto' },
  { value: 'SAMPLE', label: 'Muestra' },
  { value: 'INTERNAL_CONSUMPTION', label: 'Consumo interno' },
  { value: 'OTHER', label: 'Otro' },
];

export default function InventoryExitPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [items, setItems] = useState<ExitItem[]>([]);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('DAMAGE');

  // Search products
  const { data: searchData } = useQuery({
    queryKey: ['exit-products-search', user?.companyId, search],
    queryFn: () =>
      api.get<ApiResponse<PageResponse<Product>>>('/products', {
        params: { companyId: user?.companyId, search, page: 0, size: 10 },
      }),
    enabled: search.length >= 2 && !!user?.companyId,
  });

  // Get warehouses
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses', user?.companyId],
    queryFn: () =>
      api.get<ApiResponse<any[]>>('/inventory/warehouses', {
        params: { companyId: user?.companyId },
      }),
    enabled: !!user?.companyId,
  });

  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const products = searchData?.data?.data?.content || [];

  const addItem = (product: Product) => {
    if (product.currentStock <= 0) {
      toast.error(`${product.name} no tiene stock disponible`);
      return;
    }
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id
        ? { ...i, quantity: Math.min(i.quantity + 1, product.currentStock), subtotal: Math.min(i.quantity + 1, product.currentStock) * i.unitCost }
        : i);
      return [...prev, {
        productId: product.id,
        productName: product.name,
        productCode: product.internalCode || product.barcode || '',
        currentStock: product.currentStock,
        quantity: 1,
        unitCost: product.avgCost || product.purchasePrice,
        subtotal: product.avgCost || product.purchasePrice,
      }];
    });
    setSearch('');
    setShowResults(false);
  };

  const removeItem = (productId: string) => setItems(prev => prev.filter(i => i.productId !== productId));

  const updateQty = (productId: string, value: number) => {
    setItems(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const maxQty = i.currentStock;
      const qty = Math.min(Math.max(0, value), maxQty);
      return { ...i, quantity: qty, subtotal: qty * i.unitCost };
    }).filter(i => i.quantity > 0));
  };

  const totalItems = items.length;
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalCost = items.reduce((s, i) => s + i.subtotal, 0);
  const hasStockIssues = items.some(i => i.quantity > i.currentStock);

  const mutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const item of items) {
        const res = await api.post('/inventory/exits', null, {
          params: {
            companyId: user?.companyId,
            productId: item.productId,
            warehouseId: selectedWarehouse,
            quantity: item.quantity,
            reason,
            notes,
            userId: user?.userId,
          },
        });
        results.push(res.data);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      toast.success(`Salida registrada: ${totalItems} productos, ${totalQuantity} unidades`);
      navigate('/inventario');
    },
    onError: () => toast.error('Error al registrar la salida'),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/inventario')} className="btn-ghost p-2">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Nueva salida</h1>
            <p className="text-surface-500 text-sm mt-1">Registra una salida de inventario</p>
          </div>
        </div>
      </div>

      {/* Form header */}
      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Motivo de salida</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="input">
              {EXIT_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Bodega</label>
            <select value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)} className="input">
              <option value="">Selecciona bodega...</option>
              {(warehouses?.data?.data || []).map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Product search */}
      <div className="card p-6">
        <label className="label">Agregar productos a retirar</label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="text" placeholder="Busca producto por nombre o código..."
            value={search} onChange={e => { setSearch(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            className="input pl-9 h-12 text-base" autoFocus />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"><Barcode size={18} /></button>
        </div>

        {showResults && search.length >= 2 && (
          <div className="mt-2 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden animate-fade-in">
            {products.map(product => (
              <button key={product.id} onClick={() => addItem(product)}
                className="w-full flex items-center justify-between p-3 hover:bg-surface-50 dark:hover:bg-surface-800 
                         transition-colors border-b border-surface-100 dark:border-surface-800 last:border-0">
                <div className="flex items-center gap-3">
                  <Package size={16} className="text-surface-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-surface-400">{product.internalCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-medium', product.currentStock <= 0 ? 'text-red-500' : 'text-accent-500')}>
                    Stock: {product.currentStock.toFixed(0)}
                  </p>
                </div>
              </button>
            ))}
            {products.length === 0 && <p className="p-4 text-sm text-surface-400 text-center">Sin resultados</p>}
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="card overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-surface-400">
            <MinusCircle size={48} className="mx-auto mb-3 opacity-30" />
            <p>Busca productos arriba para agregarlos a la salida</p>
          </div>
        ) : (
          <div className="table-container border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock actual</th>
                  <th className="w-28">Cantidad a retirar</th>
                  <th className="w-28">Subtotal</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.productId}>
                    <td>
                      <p className="font-medium text-surface-900 dark:text-white">{item.productName}</p>
                      <p className="text-xs text-surface-400">{item.productCode}</p>
                    </td>
                    <td>
                      <span className={cn('font-medium', item.currentStock <= 0 ? 'text-red-500' : '')}>
                        {item.currentStock.toFixed(0)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <input type="number" value={item.quantity}
                          min={0} max={item.currentStock}
                          onChange={e => updateQty(item.productId, Number(e.target.value))}
                          className={cn('input w-24 text-center', item.quantity > item.currentStock && 'border-red-500 text-red-500')} />
                        {item.quantity > item.currentStock && (
                          <AlertTriangle size={16} className="text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="font-medium">{formatCurrency(item.subtotal)}</td>
                    <td>
                      <button onClick={() => removeItem(item.productId)} className="p-1.5 text-surface-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes + Totals */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <label className="label">Descripción del motivo</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Descripción adicional de la salida..."
            className="input h-24 resize-none" maxLength={300} />
        </div>
        <div className="card p-5 space-y-3">
          <div className="flex justify-between text-sm text-surface-500">
            <span>Productos</span>
            <span className="font-medium">{totalItems}</span>
          </div>
          <div className="flex justify-between text-sm text-surface-500">
            <span>Unidades</span>
            <span className="font-medium">{totalQuantity.toFixed(0)}</span>
          </div>
          <div className="border-t border-surface-200 dark:border-surface-700 pt-3">
            <div className="flex justify-between">
              <span className="font-semibold">Valor de salida</span>
              <span className="font-bold text-lg text-red-600">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <button onClick={() => navigate('/inventario')} className="btn-secondary">Cancelar</button>
        <button onClick={() => mutation.mutate()}
          disabled={items.length === 0 || !selectedWarehouse || hasStockIssues || mutation.isPending}
          className="btn-danger">
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Confirmar salida
        </button>
      </div>
    </div>
  );
}
