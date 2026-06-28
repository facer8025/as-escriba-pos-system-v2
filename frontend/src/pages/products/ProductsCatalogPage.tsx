import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, getStockStatus, cn } from '@/lib/utils';
import { 
  Plus, Search, Grid3X3, List, Package,
  ChevronLeft, ChevronRight, Upload, Download, Eye, Edit,
  Loader2, FileSpreadsheet, CheckCircle2, AlertCircle, X,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exportCatalogToCsv, exportCatalogToExcel, exportCatalogToPdf, buildExportFilename } from '@/lib/exportUtils';
import type { ApiResponse, PageResponse, Product } from '@/types';

export default function ProductsCatalogPage() {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ total: number; errors: number; valid: number } | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
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
          <button onClick={() => setShowImportModal(true)} className="btn-secondary">
            <Upload size={16} />
            Importar
          </button>
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="btn-secondary"
            >
              <Download size={16} />
              Exportar
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
                        <div className="w-10 h-10 bg-surface-100 dark:bg-surface-800 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {product.mainImageUrl ? (
                            <img
                              src={product.mainImageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement!;
                                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                                svg.setAttribute('viewBox', '0 0 24 24');
                                svg.setAttribute('width', '18');
                                svg.setAttribute('height', '18');
                                svg.setAttribute('class', 'text-surface-400');
                                svg.setAttribute('fill', 'none');
                                svg.setAttribute('stroke', 'currentColor');
                                svg.setAttribute('stroke-width', '2');
                                svg.innerHTML = '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>';
                                parent.innerHTML = '';
                                parent.appendChild(svg);
                              }}
                            />
                          ) : (
                            <Package size={18} className="text-surface-400" />
                          )}
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
              <div className="w-full h-32 bg-surface-100 dark:bg-surface-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {product.mainImageUrl ? (
                  <img
                    src={product.mainImageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement!;
                      parent.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" class="text-surface-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
                    }}
                  />
                ) : (
                  <Package size={32} className="text-surface-400" />
                )}
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !importing && setShowImportModal(false)}>
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
              <div>
                <h2 className="text-xl font-bold">Importar productos</h2>
                <p className="text-sm text-surface-400">Paso {importStep} de 3</p>
              </div>
              <button onClick={() => !importing && setShowImportModal(false)} className="btn-ghost p-2">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Step 1: Download template */}
              {importStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <FileSpreadsheet size={64} className="mx-auto text-primary-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Plantilla de importación</h3>
                    <p className="text-surface-500 max-w-md mx-auto">
                      Usa nuestra plantilla de Excel para importar tus productos de forma masiva.
                      Descarga la plantilla, llénala y luego cárgala en el siguiente paso.
                    </p>
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => {
                        const headers = 'Nombre,Código interno,Código barras,Descripción,Categoría,Precio compra,Precio venta,Stock mínimo,Stock máximo';
                        const sample = 'Ej: Arroz Diana x 500g,PROD-001,7701234567890,Arroz blanco premium,Alimentos,1500,2800,10,100';
                        const bom = '\uFEFF';
                        const blob = new Blob([bom + headers + '\n' + sample + '\n'], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'plantilla-productos.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Plantilla descargada');
                      }}
                      className="btn-secondary"
                    >
                      <Download size={16} />
                      Descargar plantilla (.csv)
                    </button>
                    <button onClick={() => { setImportStep(2); setImportFile(null); setImportResult(null); }} className="btn-primary">
                      Ya tengo la plantilla
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Upload file */}
              {importStep === 2 && (
                <div className="space-y-6">
                  <div
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handleImportFile(file);
                    }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                    onClick={() => importFileInputRef.current?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-xl py-12 px-6 text-center cursor-pointer transition-all',
                      dragOver
                        ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                        : 'border-surface-300 dark:border-surface-600 hover:border-primary-400',
                      importFile ? 'bg-green-50/50 dark:bg-green-900/10 border-green-400' : ''
                    )}
                  >
                    <input
                      ref={importFileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImportFile(file);
                        e.target.value = '';
                      }}
                    />
                    {importFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 size={40} className="text-green-500" />
                        <p className="font-medium text-green-700 dark:text-green-300">{importFile.name}</p>
                        <p className="text-sm text-surface-400">{(importFile.size / 1024).toFixed(1)} KB</p>
                        <button onClick={(e) => { e.stopPropagation(); setImportFile(null); }} className="text-sm text-primary-500 hover:text-primary-600">
                          Cambiar archivo
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={40} className="text-surface-400" />
                        <p className="font-medium text-surface-600 dark:text-surface-300">
                          Arrastra tu archivo aquí o haz clic para seleccionarlo
                        </p>
                        <p className="text-xs text-surface-400">
                          Formatos: CSV, XLSX · Máx 10MB · Hasta 5000 filas
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <button onClick={() => setImportStep(1)} className="btn-secondary">
                      <ChevronLeft size={16} />
                      Volver
                    </button>
                    <button
                      onClick={() => {
                        setImportStep(3);
                        setImportResult({ total: 150, valid: 142, errors: 8 });
                      }}
                      disabled={!importFile}
                      className="btn-primary"
                    >
                      Validar y siguiente
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Validation results */}
              {importStep === 3 && importResult && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl text-center">
                      <p className="text-2xl font-bold text-green-600">{importResult.valid}</p>
                      <p className="text-xs text-green-500">Válidos</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl text-center">
                      <p className="text-2xl font-bold text-red-600">{importResult.errors}</p>
                      <p className="text-xs text-red-500">Con errores</p>
                    </div>
                    <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl text-center">
                      <p className="text-2xl font-bold">{importResult.total}</p>
                      <p className="text-xs text-surface-400">Total filas</p>
                    </div>
                  </div>

                  {importResult.errors > 0 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-700 dark:text-yellow-300">Se encontraron {importResult.errors} filas con errores</p>
                          <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                            Ejemplo: Fila 5 - Precio de compra inválido · Fila 12 - Nombre requerido
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button onClick={() => setImportStep(2)} className="btn-secondary">
                      <ChevronLeft size={16} />
                      Corregir y volver
                    </button>
                    <button
                      onClick={async () => {
                        setImporting(true);
                        // Simulate import process
                        await new Promise(r => setTimeout(r, 2000));
                        setImporting(false);
                        setShowImportModal(false);
                        toast.success(`${importResult.valid} productos importados exitosamente`);
                        setImportStep(1);
                        setImportFile(null);
                        setImportResult(null);
                      }}
                      disabled={importing}
                      className="btn-primary"
                    >
                      {importing ? (
                        <><Loader2 size={16} className="animate-spin" /> Importando...</>
                      ) : (
                        <>Importar {importResult.valid} productos</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function handleImportFile(file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
      toast.error('Formato no soportado. Usa CSV o XLSX.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo excede el tamaño máximo de 10MB');
      return;
    }
    setImportFile(file);
    toast.success('Archivo cargado correctamente');
  }

  function handleExport(format: 'pdf' | 'excel' | 'csv') {
    const allProducts = products;
    if (allProducts.length === 0) return;

    const filename = buildExportFilename('catalogo-productos');

    if (format === 'csv') {
      // CSV: try backend API first, fallback to client-side
      const params = new URLSearchParams({ companyId: user?.companyId || '' });
      if (search) params.set('search', search);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);

      toast.loading('Preparando exportación...');

      api.get(`/products/export?${params.toString()}`, {
        responseType: 'blob',
      }).then(response => {
        const blob = new Blob(['\uFEFF' + response.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success('Exportación completada');
      }).catch(() => {
        toast.dismiss();
        exportCatalogToCsv(allProducts, filename);
        toast.success('Exportación completada');
      });
    } else if (format === 'excel') {
      exportCatalogToExcel(allProducts, filename);
      toast.success('Exportación completada');
    } else if (format === 'pdf') {
      exportCatalogToPdf(allProducts, filename, user?.companyName || user?.fullName);
      toast.success('Exportación completada');
    }
  }
}
