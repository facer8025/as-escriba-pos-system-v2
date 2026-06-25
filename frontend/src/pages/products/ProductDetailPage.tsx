import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, formatDate, getStockStatus, cn } from '@/lib/utils';
import { ArrowLeft, Package, Edit, ShoppingCart, FileText, Truck, AlertTriangle, BarChart3 } from 'lucide-react';
import type { ApiResponse, Product } from '@/types';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<ApiResponse<Product>>(`/products/${id}`),
    enabled: !!id,
  });

  const product = data?.data?.data;
  if (isLoading) return <div className="skeleton h-96 rounded-xl" />;
  if (!product) return <div className="text-center py-12 text-surface-400">Producto no encontrado</div>;

  const stock = getStockStatus(product.currentStock, product.stockMin, product.stockMax);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/productos')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <span className={cn('badge', product.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral')}>
                {product.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-surface-500 text-sm">{product.internalCode} · {product.barcode || 'Sin código de barras'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/productos/${id}/editar`)} className="btn-primary"><Edit size={16} /> Editar</button>
          <button onClick={() => navigate('/inventario/kardex')} className="btn-secondary"><FileText size={16} /> Kardex</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Product info */}
        <div className="col-span-2 space-y-6">
          {/* Info card */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Información del producto</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-surface-400">Categoría:</span> <span className="font-medium ml-2">{product.categoryName || '—'}</span></div>
              <div><span className="text-surface-400">Marca:</span> <span className="font-medium ml-2">{product.brandName || '—'}</span></div>
              <div><span className="text-surface-400">Nombre corto POS:</span> <span className="font-medium ml-2">{product.shortName || '—'}</span></div>
              <div><span className="text-surface-400">Unidad:</span> <span className="font-medium ml-2">{product.unitName || '—'}</span></div>
              <div><span className="text-surface-400">Código interno:</span> <span className="font-mono ml-2">{product.internalCode || '—'}</span></div>
              <div><span className="text-surface-400">Código barras:</span> <span className="font-mono ml-2">{product.barcode || '—'}</span></div>
            </div>
            {product.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-surface-400">Descripción</p>
                <p className="text-sm mt-1">{product.description}</p>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Precios e impuestos</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl text-center">
                <p className="text-xs text-surface-400">Compra</p>
                <p className="text-lg font-bold">{formatCurrency(product.purchasePrice)}</p>
              </div>
              <div className="p-4 bg-accent-50 dark:bg-accent-900/20 rounded-xl text-center">
                <p className="text-xs text-accent-500">Venta</p>
                <p className="text-lg font-bold text-accent-600">{formatCurrency(product.salePrice)}</p>
              </div>
              <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl text-center">
                <p className="text-xs text-surface-400">Mayorista</p>
                <p className="text-lg font-bold">{product.wholesalePrice ? formatCurrency(product.wholesalePrice) : '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className={cn('badge', product.vatType === 'EXCLUDED' ? 'badge-neutral' : product.vatType === 'REDUCED' ? 'badge-warning' : 'badge-success')}>
                {product.vatType === 'STANDARD' ? `IVA ${product.vatRate}%` :
                 product.vatType === 'REDUCED' ? `IVA ${product.vatRate}%` :
                 product.vatType === 'EXCLUDED' ? 'Excluido de IVA' : `IVA ${product.vatRate}%`}
              </span>
              <span className="text-surface-400">{product.vatIncluded ? 'IVA incluido en precio' : 'IVA no incluido'}</span>
            </div>
          </div>

          {/* Inventory */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Inventario</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className={cn('text-2xl font-bold', stock.color)}>{product.currentStock.toFixed(0)}</p>
                <p className="text-xs text-surface-400">Stock actual</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{product.stockMin.toFixed(0)}</p>
                <p className="text-xs text-surface-400">Stock mínimo</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{product.stockMax > 0 ? product.stockMax.toFixed(0) : '∞'}</p>
                <p className="text-xs text-surface-400">Stock máximo</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{formatCurrency(product.currentStock * product.avgCost)}</p>
                <p className="text-xs text-surface-400">Valorización</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={cn('badge', stock.status === 'out' ? 'badge-danger' : stock.status === 'low' ? 'badge-warning' : 'badge-success')}>
                {stock.label}
              </span>
              <span className="text-xs text-surface-400">Costo promedio: {formatCurrency(product.avgCost)}</span>
            </div>
          </div>
        </div>

        {/* Right - Quick actions */}
        <div className="space-y-4">
          <div className="card p-6">
            <div className="w-full h-40 bg-surface-100 dark:bg-surface-800 rounded-xl flex items-center justify-center mb-4">
              <Package size={48} className="text-surface-300" />
            </div>
            <div className="space-y-2">
              <button className="w-full btn-primary"><ShoppingCart size={16} /> Agregar al POS</button>
              <button className="w-full btn-secondary"><Truck size={16} /> Crear orden de compra</button>
              <button className="w-full btn-secondary"><AlertTriangle size={16} /> Ver alertas de stock</button>
              <button className="w-full btn-ghost"><BarChart3 size={16} /> Ver movimientos</button>
            </div>
          </div>

          <div className="card p-4 text-sm">
            <p className="text-surface-400">Creado: {formatDate(product.createdAt, 'long')}</p>
            <p className="text-surface-400 mt-1">Actualizado: {formatDate(product.updatedAt, 'relative')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
