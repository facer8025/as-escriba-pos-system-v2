import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, getStockStatus, cn } from '@/lib/utils';
import { 
  Plus, Search, Grid3X3, List, Package, SlidersHorizontal,
  ChevronDown, ChevronLeft, ChevronRight, Upload, Download, Eye, Edit,
} from 'lucide-react';
import type { ApiResponse, PageResponse, Product } from '@/types';

export default function ProductsCatalogPage() {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['products', user?.companyId, search, page, categoryFilter, statusFilter],
    queryFn: () =>
      api.get<ApiResponse<PageResponse<Product>>>('/products', {
        params: {
          companyId: user?.companyId,
          search,
          page,
          size: 25,
          sortBy: 'name',
          sortDir: 'asc',
        },
      }),
    enabled: !!user?.companyId,
    refetchInterval: 30000,
  });

  const products = data?.data?.data?.content || [];
  const totalPages = data?.data?.data?.totalPages || 0;
  const totalElements = data?.data?.data?.totalElements || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Productos</h1>
          <p className="text-surface-500 mt-1">{totalElements} productos registrados</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Upload size={16} />
            Importar
          </button>
          <button className="btn-secondary">
            <Download size={16} />
            Exportar
          </button>
          <Link to="/productos/nuevo" className="btn-primary">
            <Plus size={16} />
            Nuevo producto
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o código de barras..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="input pl-9"
            />
          </div>
          <select className="input w-auto min-w-[160px]">
            <option value="">Todas las categorías</option>
          </select>
          <select 
            className="input w-auto min-w-[140px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
            <option value="DISCONTINUED">Discontinuado</option>
          </select>
          <div className="flex items-center border-l border-surface-200 dark:border-surface-700 pl-4">
            <button
              onClick={() => setViewMode('table')}
              className={cn('p-2 rounded-lg transition-colors', 
                viewMode === 'table' ? 'bg-primary-500 text-white shadow-soft dark:bg-primary-600 dark:text-white' : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300')}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2 rounded-lg transition-colors',
                viewMode === 'grid' ? 'bg-primary-500 text-white shadow-soft dark:bg-primary-600 dark:text-white' : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300')}
            >
              <Grid3X3 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <Package size={48} className="mx-auto text-surface-300 mb-4" />
          <h3 className="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">
            No hay productos
          </h3>
          <p className="text-surface-500 mb-4">Aún no tienes productos registrados. Crea el primero.</p>
          <Link to="/productos/nuevo" className="btn-primary">
            <Plus size={16} />
            Nuevo producto
          </Link>
        </div>
      ) : viewMode === 'table' ? (
        <div className="table-container animate-fade-in">
          <table className="table">
            <thead>
              <tr>
                <th className="w-10">
                  <input type="checkbox" className="rounded" />
                </th>
                <th>Producto</th>
                <th>Código</th>
                <th>Categoría</th>
                <th>Precio venta</th>
                <th>Tipo IVA</th>
                <th>Stock</th>
                <th>Estado</th>
                <th className="w-20">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stock = getStockStatus(product.currentStock, product.stockMin, product.stockMax);
                return (
                  <tr key={product.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                    <td><input type="checkbox" className="rounded" /></td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface-100 dark:bg-surface-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package size={18} className="text-surface-400" />
                        </div>
                        <div>
                          <p className="font-medium text-surface-900 dark:text-white">{product.name}</p>
                          <p className="text-xs text-surface-400">{product.internalCode || product.barcode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{product.internalCode || '-'}</td>
                    <td>
                      <span className="badge inline-flex items-center gap-1.5"
                            style={{
                              backgroundColor: product.categoryColor ? product.categoryColor + '20' : '',
                              color: product.categoryColor || undefined,
                              border: product.categoryColor ? '1px solid ' + product.categoryColor + '40' : undefined,
                            }}>
                        {product.categoryColor && (
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: product.categoryColor }} />
                        )}
                        {product.categoryName || '-'}
                      </span>
                    </td>
                    <td className="font-medium">{formatCurrency(product.salePrice)}</td>
                    <td>
                      <span className={cn(
                        'badge',
                        product.vatType === 'EXCLUDED' ? 'badge-neutral' :
                        product.vatType === 'REDUCED' ? 'badge-warning' :
                        product.vatType === 'EXEMPT' ? 'badge-info' :
                        'badge-success'
                      )}>
                        {product.vatType === 'STANDARD' ? `${product.vatRate}%` :
                         product.vatType === 'REDUCED' ? `${product.vatRate}%` :
                         product.vatType === 'EXCLUDED' ? 'Excluido' :
                         product.vatType === 'EXEMPT' ? 'Exento' :
                         product.vatType || `${product.vatRate}%`}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={cn('font-medium', stock.color)}>
                          {product.currentStock.toFixed(0)}
                        </span>
                        <span className={cn('text-xs', stock.color)}>{stock.label}</span>
                      </div>
                    </td>
                    <td>
                      <span className={cn(
                        'badge',
                        product.status === 'ACTIVE' ? 'badge-success' : 
                        product.status === 'INACTIVE' ? 'badge-neutral' : 'badge-danger'
                      )}>
                        {product.status === 'ACTIVE' ? 'Activo' : 
                         product.status === 'INACTIVE' ? 'Inactivo' : 'Discontinuado'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link to={`/productos/${product.id}`} className="btn-ghost p-1.5" title="Ver detalle">
                          <Eye size={14} />
                        </Link>
                        <Link to={`/productos/${product.id}/editar`} className="btn-ghost p-1.5" title="Editar">
                          <Edit size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
          {products.map((product) => (
            <div key={product.id} className="card-hover p-4">
              <div className="w-full h-32 bg-surface-100 dark:bg-surface-800 rounded-lg mb-3 flex items-center justify-center">
                <Package size={32} className="text-surface-400" />
              </div>
              <h3 className="font-medium text-surface-900 dark:text-white truncate">{product.name}</h3>
              <p className="text-xs text-surface-400 mb-2">{product.internalCode}</p>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatCurrency(product.salePrice)}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn('text-sm font-medium', getStockStatus(product.currentStock, product.stockMin, product.stockMax).color)}>
                  {product.currentStock.toFixed(0)} {product.unitName}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Mostrando 1-{Math.min(25, totalElements)} de {totalElements} productos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost p-2"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                  page === i 
                    ? 'bg-primary-500 text-white' 
                    : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn-ghost p-2"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
