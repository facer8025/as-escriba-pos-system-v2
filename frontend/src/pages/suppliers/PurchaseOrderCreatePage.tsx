import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Package, Search, X, Plus, Save, Send, ArrowLeft,
  Loader2, Building2, Calendar,
} from 'lucide-react';
import type { ApiResponse, Product, PageResponse, Supplier, PurchaseOrder } from '@/types';

interface POItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitCost: number;
  discountPct: number;
  vatRate: number;
  subtotal: number;
}

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [items, setItems] = useState<POItem[]>([]);
  const [notes, setNotes] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  // Search suppliers
  const { data: supplierData } = useQuery({
    queryKey: ['suppliers-search', user?.companyId, supplierSearch],
    queryFn: () => api.get<ApiResponse<Supplier[]>>('/suppliers/search', {
      params: { companyId: user?.companyId, term: supplierSearch },
    }),
    enabled: supplierSearch.length >= 2 && !!user?.companyId,
  });

  // Search products
  const { data: productData } = useQuery({
    queryKey: ['po-products', user?.companyId, search],
    queryFn: () => api.get<ApiResponse<PageResponse<Product>>>('/products', {
      params: { companyId: user?.companyId, search, page: 0, size: 10 },
    }),
    enabled: search.length >= 2 && !!user?.companyId,
  });

  const products = productData?.data?.data?.content || [];
  const suppliers = supplierData?.data?.data || [];

  const addItem = (product: Product) => {
    setItems(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitCost } : i);
      return [...prev, {
        productId: product.id, productName: product.name, productCode: product.internalCode || '',
        quantity: 1, unitCost: product.purchasePrice, discountPct: 0, vatRate: product.vatRate,
        subtotal: product.purchasePrice,
      }];
    });
    setSearch('');
  };

  const updateItem = (productId: string, field: string, value: number) => {
    setItems(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const item = { ...i, [field]: value };
      const base = item.unitCost * item.quantity;
      const disc = base * (item.discountPct / 100);
      item.subtotal = base - disc;
      return item;
    }));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.productId !== id));

  const subtotal = items.reduce((s, i) => s + i.unitCost * i.quantity, 0);
  const discountTotal = items.reduce((s, i) => s + (i.unitCost * i.quantity * i.discountPct / 100), 0);
  const taxTotal = items.reduce((s, i) => {
    const base = i.unitCost * i.quantity;
    const disc = base * (i.discountPct / 100);
    return s + (base - disc) * (i.vatRate / 100);
  }, 0);
  const total = subtotal - discountTotal + taxTotal;

  const mutation = useMutation({
    mutationFn: (action: 'DRAFT' | 'SEND') => {
      const order = {
        company: { id: user?.companyId },
        supplier: { id: selectedSupplier!.id },
        supplierId: selectedSupplier!.id,
        expectedDate: expectedDate || null,
        notesSupplier: notes,
        status: action === 'SEND' ? 'SENT' : 'DRAFT',
        currency: 'COP',
        items: items.map(i => ({
          product: { id: i.productId },
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
          discountPct: i.discountPct,
          vatRate: i.vatRate,
          subtotal: i.unitCost * i.quantity - (i.unitCost * i.quantity * i.discountPct / 100),
          taxAmount: (i.unitCost * i.quantity - (i.unitCost * i.quantity * i.discountPct / 100)) * (i.vatRate / 100),
          total: i.unitCost * i.quantity - (i.unitCost * i.quantity * i.discountPct / 100) + 
                 ((i.unitCost * i.quantity - (i.unitCost * i.quantity * i.discountPct / 100)) * (i.vatRate / 100)),
        })),
      };
      return api.post('/purchase-orders', order);
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success(action === 'SEND' ? 'Orden enviada al proveedor' : 'Borrador guardado');
      navigate('/proveedores/ordenes');
    },
    onError: () => toast.error('Error al crear la orden'),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/proveedores/ordenes')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold">Nueva orden de compra</h1>
            <p className="text-surface-500 text-sm mt-1">Crea una orden para solicitar mercancía a un proveedor</p>
          </div>
        </div>
      </div>

      {/* Supplier selection */}
      <div className="card p-6">
        <label className="label">Proveedor</label>
        {selectedSupplier ? (
          <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Building2 size={20} className="text-surface-400" />
              <div>
                <p className="font-medium">{selectedSupplier.businessName}</p>
                <p className="text-xs text-surface-400">{selectedSupplier.documentNumber}</p>
              </div>
            </div>
            <button onClick={() => setSelectedSupplier(null)} className="p-1 text-surface-400 hover:text-red-500"><X size={16} /></button>
          </div>
        ) : (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" placeholder="Busca proveedor por nombre o NIT..." value={supplierSearch}
              onChange={e => setSupplierSearch(e.target.value)} className="input pl-9 h-12" />
            {supplierSearch.length >= 2 && (
              <div className="mt-2 border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
                {suppliers.map(s => (
                  <button key={s.id} onClick={() => { setSelectedSupplier(s); setSupplierSearch(''); }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors border-b last:border-0">
                    <Building2 size={16} className="text-surface-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{s.businessName}</p>
                      <p className="text-xs text-surface-400">{s.documentNumber}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dates + Notes */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Fecha de entrega esperada</label>
          <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Notas para el proveedor</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Condiciones, observaciones..." className="input h-10 resize-none" />
        </div>
      </div>

      {/* Products */}
      <div className="card p-6">
        <label className="label">Productos</label>
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="text" placeholder="Agrega productos a la orden..." value={search}
            onChange={e => setSearch(e.target.value)} className="input pl-9 h-12" />
          {search.length >= 2 && (
            <div className="mt-2 border rounded-xl overflow-hidden">
              {products.map(p => (
                <button key={p.id} onClick={() => addItem(p)}
                  className="w-full flex items-center justify-between p-3 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Package size={16} className="text-surface-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-surface-400">Costo: {formatCurrency(p.purchasePrice)} · Stock: {p.currentStock.toFixed(0)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-accent-500">+ Agregar</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-surface-400">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p>Busca productos arriba para agregarlos a la orden</p>
          </div>
        ) : (
          <div className="table-container border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="w-20">Cant.</th>
                  <th className="w-28">Costo und.</th>
                  <th className="w-20">Dto %</th>
                  <th className="w-20">IVA</th>
                  <th className="w-28">Subtotal</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.productId}>
                    <td>
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-surface-400">{item.productCode}</p>
                    </td>
                    <td><input type="number" value={item.quantity} min={1} onChange={e => updateItem(item.productId, 'quantity', Math.max(1, Number(e.target.value)))} className="input w-16 text-center" /></td>
                    <td><input type="number" value={item.unitCost} min={0} step={100} onChange={e => updateItem(item.productId, 'unitCost', Math.max(0, Number(e.target.value)))} className="input w-24 text-right" /></td>
                    <td><input type="number" value={item.discountPct} min={0} max={100} onChange={e => updateItem(item.productId, 'discountPct', Math.max(0, Math.min(100, Number(e.target.value))))} className="input w-16 text-center" /></td>
                    <td className="text-center text-sm">{item.vatRate}%</td>
                    <td className="font-medium text-sm">{formatCurrency(item.subtotal)}</td>
                    <td><button onClick={() => removeItem(item.productId)} className="p-1 text-surface-400 hover:text-red-500"><X size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="card p-5 ml-auto w-72 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-surface-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        {discountTotal > 0 && <div className="flex justify-between text-sm text-red-500"><span>Descuentos</span><span>-{formatCurrency(discountTotal)}</span></div>}
        <div className="flex justify-between text-sm"><span className="text-surface-500">IVA</span><span>{formatCurrency(taxTotal)}</span></div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total</span><span className="text-primary-600 dark:text-primary-400">{formatCurrency(total)}</span></div>
        <p className="text-xs text-surface-400 text-center">{items.length} productos · {items.reduce((s, i) => s + i.quantity, 0)} unidades</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-8">
        <button onClick={() => navigate('/proveedores/ordenes')} className="btn-secondary">Cancelar</button>
        <button onClick={() => mutation.mutate('DRAFT')} disabled={!selectedSupplier || items.length === 0 || mutation.isPending} className="btn-secondary">
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar borrador
        </button>
        <button onClick={() => mutation.mutate('SEND')} disabled={!selectedSupplier || items.length === 0 || mutation.isPending} className="btn-primary">
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Guardar y enviar
        </button>
      </div>
    </div>
  );
}
