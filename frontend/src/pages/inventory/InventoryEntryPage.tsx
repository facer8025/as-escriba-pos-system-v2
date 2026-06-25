import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Package, Search, X, Plus, Save, ArrowLeft,
  Loader2, Barcode,
} from 'lucide-react';
import type { ApiResponse, Product, PageResponse, InventoryMovement } from '@/types';

interface EntryItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export default function InventoryEntryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [items, setItems] = useState<EntryItem[]>([]);
  const [notes, setNotes] = useState('');
  const [entryType, setEntryType] = useState('PURCHASE');

  // Search products
  const { data: searchResults } = useQuery({
    queryKey: ['products-search', user?.companyId, search],
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

  const products = searchResults?.data?.data?.content || [];

  const addItem = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitCost }
            : i
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        productCode: product.internalCode || product.barcode || '',
        quantity: 1,
        unitCost: product.purchasePrice,
        subtotal: product.purchasePrice,
      }];
    });
    setSearch('');
    setShowResults(false);
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const updateItem = (productId: string, field: 'quantity' | 'unitCost', value: number) => {
    setItems(prev => prev.map(i =>
      i.productId === productId
        ? { ...i, [field]: value, subtotal: (field === 'quantity' ? value : i.quantity) * (field === 'unitCost' ? value : i.unitCost) }
        : i
    ));
  };

  const totalItems = items.length;
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalCost = items.reduce((s, i) => s + i.subtotal, 0);

  const mutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const item of items) {
        const res = await api.post('/inventory/entries', null, {
          params: {
            companyId: user?.companyId,
            productId: item.productId,
            warehouseId: selectedWarehouse,
            quantity: item.quantity,
            unitCost: item.unitCost,
            referenceType: entryType,
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
      toast.success(`Entrada registrada: ${totalItems} productos, ${totalQuantity} unidades`);
      navigate('/inventario');
    },
    onError: () => {
      toast.error('Error al registrar la entrada');
    },
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
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Nueva entrada</h1>
            <p className="text-surface-500 text-sm mt-1">Registra la entrada de mercancía al inventario</p>
          </div>
        </div>
      </div>

      {/* Entry form */}
      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo de entrada</label>
            <select
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              className="input"
            >
              <option value="PURCHASE">Compra directa</option>
              <option value="ADJUSTMENT_POSITIVE">Ajuste positivo</option>
              <option value="RETURN">Devolución de cliente</option>
              <option value="OTHER">Otros</option>
            </select>
          </div>
          <div>
            <label className="label">Bodega de destino</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="input"
            >
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
        <label className="label">Agregar productos</label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Escanea código de barras o busca por nombre..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            className="input pl-9 h-12 text-base"
            autoFocus
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
            <Barcode size={18} />
          </button>
        </div>

        {/* Search results */}
        {showResults && search.length >= 2 && (
          <div className="mt-2 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden animate-fade-in">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addItem(product)}
                className="w-full flex items-center justify-between p-3 hover:bg-surface-50 dark:hover:bg-surface-800 
                         transition-colors border-b border-surface-100 dark:border-surface-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Package size={16} className="text-surface-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-surface-400">{product.internalCode} · Stock: {product.currentStock.toFixed(0)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{formatCurrency(product.purchasePrice)}</p>
                  <p className="text-xs text-accent-500">Clic para agregar</p>
                </div>
              </button>
            ))}
            {products.length === 0 && (
              <p className="p-4 text-sm text-surface-400 text-center">No se encontraron productos</p>
            )}
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="card overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-surface-400">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p>Busca productos arriba para agregarlos a la entrada</p>
          </div>
        ) : (
          <div className="table-container border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="w-24">Cantidad</th>
                  <th className="w-28">Costo unitario</th>
                  <th className="w-28">Subtotal</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td>
                      <p className="font-medium text-surface-900 dark:text-white">{item.productName}</p>
                      <p className="text-xs text-surface-400">{item.productCode}</p>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        min={0.001}
                        step={1}
                        onChange={(e) => updateItem(item.productId, 'quantity', Math.max(0.001, Number(e.target.value)))}
                        className="input w-20 text-center"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.unitCost}
                        min={0}
                        step={100}
                        onChange={(e) => updateItem(item.productId, 'unitCost', Math.max(0, Number(e.target.value)))}
                        className="input w-28 text-right"
                      />
                    </td>
                    <td className="font-medium">{formatCurrency(item.subtotal)}</td>
                    <td>
                      <button onClick={() => removeItem(item.productId)} className="p-1.5 text-surface-400 hover:text-red-500 transition-colors">
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
          <label className="label">Observaciones</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales sobre la entrada..."
            className="input h-24 resize-none"
            maxLength={300}
          />
        </div>
        <div className="card p-5 space-y-3">
          <div className="flex justify-between text-sm text-surface-500">
            <span>Total ítems</span>
            <span className="font-medium">{totalItems}</span>
          </div>
          <div className="flex justify-between text-sm text-surface-500">
            <span>Total unidades</span>
            <span className="font-medium">{totalQuantity.toFixed(2)}</span>
          </div>
          <div className="border-t border-surface-200 dark:border-surface-700 pt-3">
            <div className="flex justify-between">
              <span className="font-semibold text-surface-900 dark:text-white">Costo total</span>
              <span className="font-bold text-lg text-primary-600 dark:text-primary-400">
                {formatCurrency(totalCost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <button onClick={() => navigate('/inventario')} className="btn-secondary">
          Cancelar
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={items.length === 0 || !selectedWarehouse || mutation.isPending}
          className="btn-primary"
        >
          {mutation.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Confirmar entrada
        </button>
      </div>
    </div>
  );
}
