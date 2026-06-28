import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Package, AlertTriangle, TrendingUp, DollarSign,
  Search, ArrowUpDown, FileDown,
  FileText, FileSpreadsheet, Download,
} from 'lucide-react';
import { exportToCsv, exportToExcel, exportToPdf, buildExportFilename } from '@/lib/exportUtils';
import type { ApiResponse, Product, PageResponse } from '@/types';

export default function InventorySummaryPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [stockFilter, setStockFilter] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['inventory-products', user?.companyId, search, page, stockFilter],
    queryFn: () =>
      api.get<ApiResponse<PageResponse<Product>>>('/products', {
        params: {
          companyId: user?.companyId,
          search: search || undefined,
          page,
          size: 25,
          sortBy: 'currentStock',
          sortDir: 'asc',
        },
      }),
    enabled: !!user?.companyId,
    refetchInterval: 30000,
  });

  // Fetch inventory summary from backend API
  const { data: summaryData } = useQuery({
    queryKey: ['inventory-summary', user?.companyId],
    queryFn: () =>
      api.get<ApiResponse<{ totalProducts: number; outOfStock: number; criticalStock: number; inventoryValue: number }>>('/inventory/summary', {
        params: { companyId: user?.companyId },
      }),
    enabled: !!user?.companyId,
    refetchInterval: 30000,
  });

  const products = productsData?.data?.data?.content || [];
  const totalElements = productsData?.data?.data?.totalElements || 0;
  const invSummary = summaryData?.data?.data;

  const stats = [
    {
      label: 'Total productos',
      value: invSummary?.totalProducts ?? totalElements,
      icon: Package,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Stock crítico',
      value: invSummary?.criticalStock ?? products.filter(p => p.currentStock > 0 && p.currentStock <= p.stockMin).length,
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      label: 'Sin stock',
      value: invSummary?.outOfStock ?? products.filter(p => p.currentStock <= 0).length,
      icon: TrendingUp,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Valor inventario',
      value: formatCurrency(invSummary?.inventoryValue ?? 0),
      icon: DollarSign,
      color: 'text-accent-500',
      bg: 'bg-accent-50 dark:bg-accent-900/20',
    },
  ];

  // Apply local stock filter
  const filteredProducts = stockFilter
    ? products.filter(p => {
        if (stockFilter === 'low') return p.currentStock > 0 && p.currentStock <= p.stockMin;
        if (stockFilter === 'out') return p.currentStock <= 0;
        if (stockFilter === 'normal') return p.currentStock > p.stockMin;
        return true;
      })
    : products;

  const getStockBadge = (current: number, min: number) => {
    if (current <= 0) return { label: 'Sin stock', class: 'badge-danger' };
    if (current <= min) return { label: 'Stock bajo', class: 'badge-warning' };
    return { label: 'En stock', class: 'badge-success' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Inventario</h1>
          <p className="text-surface-500 mt-1">Resumen de stock y movimientos</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="btn-secondary"
            >
              <FileDown size={16} /> Exportar
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1e1e3a] border border-surface-200 dark:border-surface-700 rounded-xl shadow-soft z-50 py-1 animate-fade-in">
                <button
                  onClick={() => { handleExport('pdf'); setExportOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <FileText size={16} className="text-red-500" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => { handleExport('excel'); setExportOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => { handleExport('csv'); setExportOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <Download size={16} className="text-blue-500" />
                  <span>CSV</span>
                </button>
              </div>
            )}
          </div>
          <a href="/inventario/entradas/nueva" className="btn-primary"><Package size={16} /> Nueva entrada</a>
          <a href="/inventario/salidas/nueva" className="btn-secondary"><Package size={16} /> Nueva salida</a>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card p-5 hover:shadow-card-hover transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}><stat.icon size={20} className={stat.color} /></div>
            </div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-surface-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text" placeholder="Buscar producto por nombre o código..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="input pl-9"
            />
          </div>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="input w-auto min-w-[160px]">
            <option value="">Todos los stocks</option>
            <option value="low">Stock bajo</option>
            <option value="out">Sin stock</option>
            <option value="normal">Stock normal</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th><th>Código</th><th>Categoría</th>
              <th>Stock mínimo</th><th>Stock actual</th><th>Stock máximo</th>
              <th>Costo promedio</th><th>Valor total</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="text-center py-12 text-surface-400">Cargando...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-surface-400">
                <Package size={48} className="mx-auto mb-3 opacity-30" />
                {search ? 'Sin resultados para "' + search + '"' : 'No hay productos en inventario'}
              </td></tr>
            ) : (
              filteredProducts.map((product) => {
                const stock = getStockBadge(product.currentStock, product.stockMin);
                return (
                  <tr key={product.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-surface-100 dark:bg-surface-800 rounded-lg flex items-center justify-center">
                          <Package size={16} className="text-surface-400" />
                        </div>
                        <span className="font-medium text-surface-900 dark:text-white">{product.name}</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-surface-500">{product.internalCode || '-'}</td>
                    <td><span className="badge-neutral">{product.categoryName || '-'}</span></td>
                    <td className="text-surface-500">{product.stockMin.toFixed(0)}</td>
                    <td>
                      <span className={cn('font-semibold',
                        product.currentStock <= 0 ? 'text-red-600' :
                        product.currentStock <= product.stockMin ? 'text-yellow-600' : 'text-accent-600')}>
                        {product.currentStock.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-surface-500">{product.stockMax > 0 ? product.stockMax.toFixed(0) : 'Sin límite'}</td>
                    <td>{formatCurrency(product.avgCost)}</td>
                    <td className="font-medium">{formatCurrency(product.currentStock * product.avgCost)}</td>
                    <td><span className={stock.class}>{stock.label}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalElements > 25 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-400">
            Mostrando {page * 25 + 1}-{Math.min((page + 1) * 25, totalElements)} de {totalElements}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-ghost p-2">Anterior</button>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 25 >= totalElements} className="btn-ghost p-2">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );

  /** Export handlers */
  function handleExport(format: 'pdf' | 'excel' | 'csv') {
    const allProducts = filteredProducts.length > 0 ? filteredProducts : products;
    if (allProducts.length === 0) return;

    const filename = buildExportFilename('inventario-resumen');

    switch (format) {
      case 'csv':
        exportToCsv(allProducts, filename);
        break;
      case 'excel':
        exportToExcel(allProducts, filename);
        break;
      case 'pdf':
        exportToPdf(allProducts, filename, user?.companyName || user?.fullName);
        break;
    }
  }
}
