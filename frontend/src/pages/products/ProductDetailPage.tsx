import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, formatDate, getStockStatus, cn } from '@/lib/utils';
import { ArrowLeft, Package, Edit, ShoppingCart, FileText, Truck, AlertTriangle, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ApiResponse, Product } from '@/types';

interface ProductImage {
  id: string;
  imageUrl: string;
  primary: boolean;
  sortOrder: number;
  createdAt: string;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<ApiResponse<Product>>(`/products/${id}`),
    enabled: !!id,
  });

  const { data: imagesData } = useQuery({
    queryKey: ['product-images', id],
    queryFn: () => api.get<ApiResponse<ProductImage[]>>(`/products/${id}/images`),
    enabled: !!id,
  });

  const product = data?.data?.data;
  const images = imagesData?.data?.data || [];
  const mainImage = images.find(img => img.primary) || images[0];
  const otherImages = images.filter(img => !(img.primary && images.length > 1) && img.id !== mainImage?.id);

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

        {/* Right - Images and Quick actions */}
        <div className="space-y-4">
          {/* Product Image */}
          <div className="card p-6">
            {/* Main image */}
            <div
              className="w-full h-48 bg-surface-100 dark:bg-surface-800 rounded-xl flex items-center justify-center mb-3 overflow-hidden cursor-pointer"
              onClick={() => images.length > 0 && setShowGalleryModal(true)}
            >
              {mainImage ? (
                <img
                  src={mainImage.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement!;
                    parent.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" class="text-surface-300"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
                  }}
                />
              ) : (
                <Package size={48} className="text-surface-300" />
              )}
            </div>

            {/* Thumbnail gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setShowGalleryModal(true);
                    }}
                    className={cn(
                      'w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all',
                      (img.primary || mainImage?.id === img.id)
                        ? 'border-primary-500 ring-1 ring-primary-500'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                    )}
                  >
                    <img
                      src={img.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image count */}
            {images.length > 0 && (
              <p className="text-xs text-surface-400 text-center mt-2">
                {images.length} imagen(es) · Haz clic para ver galería
              </p>
            )}

            <div className="space-y-2 mt-4">
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

      {/* Gallery Modal */}
      {showGalleryModal && images.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowGalleryModal(false)}>
          <div className="relative max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
            {/* Close button */}
            <button onClick={() => setShowGalleryModal(false)} className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            {/* Current image */}
            <div className="bg-black rounded-2xl overflow-hidden flex items-center justify-center max-h-[70vh]">
              <img
                src={images[selectedImageIndex]?.imageUrl}
                alt={product.name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(prev => (prev + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Thumbnails below */}
            <div className="flex justify-center gap-2 mt-4">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={cn(
                    'w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                    idx === selectedImageIndex
                      ? 'border-white ring-1 ring-white'
                      : 'border-white/30 hover:border-white/60'
                  )}
                >
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Counter */}
            <p className="text-white/60 text-sm text-center mt-2">
              {selectedImageIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
