import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Package, Save, ArrowLeft, Loader2, Image, Barcode,
  Camera, X, Info, DollarSign, Boxes, Tag, Trash2, Star, Upload,
} from 'lucide-react';
import type { ApiResponse, Product, Category } from '@/types';

const VAT_TYPES = [
  { value: 'STANDARD', label: 'IVA General 19%', rate: 19 },
  { value: 'REDUCED', label: 'IVA Reducido 5%', rate: 5 },
  { value: 'EXCLUDED', label: 'Excluido (no causa IVA)', rate: 0 },
  { value: 'EXEMPT', label: 'Exento 0%', rate: 0 },
];

const PRODUCT_STATUSES = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'DISCONTINUED', label: 'Discontinuado' },
];

// ========== Image Types ==========
interface ProductImageData {
  id: string;
  imageUrl: string;
  primary: boolean;
  sortOrder: number;
  createdAt: string;
}

interface NewImageFile {
  file: File;
  previewUrl: string;
  uploading: boolean;
}

interface ProductForm {
  name: string;
  shortName: string;
  description: string;
  internalCode: string;
  barcode: string;
  categoryId: string;
  brandName: string;
  unitId: number;
  status: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice: number;
  vatType: string;
  vatRate: number;
  vatIncluded: boolean;
  manageInventory: boolean;
  stockMin: number;
  stockMax: number;
  reorderPoint: number;
  weight: number;
  expirationControl: boolean;
}

export default function ProductFormPage() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    name: '', shortName: '', description: '', internalCode: '', barcode: '',
    categoryId: '', brandName: '', unitId: 1, status: 'ACTIVE',
    purchasePrice: 0, salePrice: 0, wholesalePrice: 0,
    vatType: 'STANDARD', vatRate: 19, vatIncluded: true,
    manageInventory: true, stockMin: 0, stockMax: 0, reorderPoint: 0,
    weight: 0, expirationControl: false,
  });

  // Image state
  const [existingImages, setExistingImages] = useState<ProductImageData[]>([]);
  const [newImages, setNewImages] = useState<NewImageFile[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  // Load product if editing
  const { data: productData } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<ApiResponse<Product>>(`/products/${id}`),
    enabled: isEditing,
  });

  // Load existing images if editing
  const { data: imagesData } = useQuery({
    queryKey: ['product-images', id],
    queryFn: () => api.get<ApiResponse<ProductImageData[]>>(`/products/${id}/images`),
    enabled: isEditing,
  });

  // Sync image data from API response into state
  useEffect(() => {
    if (imagesData?.data?.data && existingImages.length === 0 && isEditing) {
      setExistingImages(imagesData.data.data);
    }
  }, [imagesData?.data?.data]);

  // Set form from loaded product
  useEffect(() => {
    if (productData?.data?.data) {
      const p = productData.data.data;
      setForm(prev => ({
        ...prev,
        name: p.name, shortName: p.shortName || '', description: p.description || '',
        internalCode: p.internalCode || '', barcode: p.barcode || '',
        categoryId: p.categoryId || '', brandName: p.brandName || '',
        status: p.status, purchasePrice: p.purchasePrice,
        salePrice: p.salePrice, wholesalePrice: p.wholesalePrice || 0,
        vatType: p.vatType, vatRate: p.vatRate, vatIncluded: p.vatIncluded,
        manageInventory: p.manageInventory,
        stockMin: p.stockMin, stockMax: p.stockMax, reorderPoint: p.reorderPoint,
        weight: p.weight || 0, expirationControl: p.expirationControl || false,
      }));
    }
  }, [productData?.data?.data]);

  // Load categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', user?.companyId],
    queryFn: () => api.get<ApiResponse<Category[]>>('/categories', { params: { companyId: user?.companyId } }),
    enabled: !!user?.companyId,
  });

  const categories = categoriesData?.data?.data || [];

  // Calculate margin
  const margin = form.salePrice > 0 && form.purchasePrice > 0
    ? ((form.salePrice - form.purchasePrice) / form.salePrice * 100)
    : 0;

  // Calculate totals
  const basePrice = form.vatIncluded
    ? form.salePrice / (1 + form.vatRate / 100)
    : form.salePrice;
  const vatAmount = form.vatIncluded
    ? form.salePrice - basePrice
    : form.salePrice * (form.vatRate / 100);
  const finalPrice = form.vatIncluded ? form.salePrice : form.salePrice + vatAmount;

  const update = (field: keyof ProductForm, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        companyId: user?.companyId,
        unitId: form.unitId || 1,
      };
      return isEditing
        ? api.put(`/products/${id}`, payload)
        : api.post('/products', payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (!isEditing) {
        const newProductId = response?.data?.data?.id;
        toast.success('Producto creado. Ahora puedes agregar imágenes.');
        navigate(newProductId ? `/productos/${newProductId}/editar` : '/productos');
      } else {
        toast.success('Producto actualizado');
        navigate('/productos');
      }
    },
    onError: () => toast.error('Error al guardar el producto'),
  });

  // ========== Image Upload ==========
  const uploadImageMutation = useMutation({
    mutationFn: async ({ productId, file, isPrimary }: { productId: string; file: File; isPrimary: boolean }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('primary', String(isPrimary));
      return api.post<ApiResponse<ProductImageData>>(`/products/${productId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (response, variables) => {
      const imageData = response?.data?.data;
      if (imageData) {
        setExistingImages(prev => {
          const updated = imageData.primary
            ? prev.map(img => ({ ...img, primary: false }))
            : prev;
          return [...updated, imageData];
        });
      }
      setNewImages(prev => prev.filter(ni => ni.file !== variables.file));
      setUploadingCount(prev => Math.max(0, prev - 1));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Imagen subida');
    },
    onError: () => {
      toast.error('Error al subir imagen');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) =>
      api.delete(`/products/${id}/images/${imageId}`),
    onSuccess: (_data, imageId) => {
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Imagen eliminada');
    },
    onError: () => toast.error('Error al eliminar imagen'),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (imageId: string) =>
      api.put(`/products/${id}/images/${imageId}/primary`),
    onSuccess: (_data, imageId) => {
      setExistingImages(prev =>
        prev.map(img => ({
          ...img,
          primary: img.id === imageId,
        }))
      );
      toast.success('Imagen principal actualizada');
    },
    onError: () => toast.error('Error al actualizar imagen principal'),
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const totalImages = existingImages.length + newImages.length;
    const remainingSlots = 5 - totalImages;

    if (remainingSlots <= 0) {
      toast.error('Máximo 5 imágenes por producto');
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    const validFiles = filesToAdd.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
        toast.error(`Formato no soportado: ${file.name}`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Archivo muy grande: ${file.name} (máx 5MB)`);
        return false;
      }
      return true;
    });

    const newImageFiles: NewImageFile[] = validFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: false,
    }));

    setNewImages(prev => [...prev, ...newImageFiles]);
  };

  const uploadNewImages = async (productId: string) => {
    const filesToUpload = newImages.filter(ni => !ni.uploading);
    if (filesToUpload.length === 0) return;

    setUploadingCount(filesToUpload.length);
    setNewImages(prev => prev.map(ni =>
      filesToUpload.some(f => f.file === ni.file) ? { ...ni, uploading: true } : ni
    ));

    const isFirstImage = existingImages.length === 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      const ni = filesToUpload[i];
      await uploadImageMutation.mutateAsync({
        productId,
        file: ni.file,
        isPrimary: isFirstImage && i === 0,
      });
      URL.revokeObjectURL(ni.previewUrl);
    }

    setNewImages([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeNewImage = (index: number) => {
    const ni = newImages[index];
    URL.revokeObjectURL(ni.previewUrl);
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const tabs = [
    { id: 'general', label: 'Información general', icon: Info },
    { id: 'pricing', label: 'Precios e impuestos', icon: DollarSign },
    { id: 'inventory', label: 'Inventario', icon: Boxes },
    { id: 'images', label: 'Imágenes', icon: Image },
  ];

  const totalImages = existingImages.length + newImages.length;
  const canAddMore = totalImages < 5;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/productos')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold">{isEditing ? 'Editar producto' : 'Nuevo producto'}</h1>
            <p className="text-surface-500 text-sm">{isEditing ? form.name : 'Completa los datos del producto'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-surface-200 dark:border-surface-800">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-300'
                  : 'border-transparent text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200')}>
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* TAB 1: General */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nombre del producto *</label>
                  <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                    placeholder="Ej: Arroz Diana x 500g" className="input" maxLength={120} />
                </div>
                <div>
                  <label className="label">Nombre corto para POS</label>
                  <input type="text" value={form.shortName} onChange={e => update('shortName', e.target.value)}
                    placeholder="Ej: Arroz Diana" className="input" maxLength={40} />
                </div>
                <div>
                  <label className="label">Código interno</label>
                  <input type="text" value={form.internalCode} onChange={e => update('internalCode', e.target.value)}
                    placeholder="AUTO o PROD-001" className="input" maxLength={20} />
                </div>
                <div>
                  <label className="label">Código de barras</label>
                  <div className="relative">
                    <input type="text" value={form.barcode} onChange={e => update('barcode', e.target.value)}
                      placeholder="Escanea o digita" className="input pr-10" />
                    <Barcode size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
                  </div>
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <select value={form.categoryId} onChange={e => update('categoryId', e.target.value)} className="input">
                    <option value="">Selecciona categoría...</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Marca</label>
                  <input type="text" value={form.brandName} onChange={e => update('brandName', e.target.value)}
                    placeholder="Ej: Diana, Bimbo..." className="input" />
                </div>
                <div>
                  <label className="label">Estado</label>
                  <select value={form.status} onChange={e => update('status', e.target.value)} className="input">
                    {PRODUCT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea value={form.description} onChange={e => update('description', e.target.value)}
                  placeholder="Describe el producto..." className="input h-20 resize-none" maxLength={500} />
              </div>
            </div>
          )}

          {/* TAB 2: Pricing */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Precio de compra (sin IVA)</label>
                  <input type="number" value={form.purchasePrice} min={0} step={100}
                    onChange={e => update('purchasePrice', Number(e.target.value))} className="input" />
                </div>
                <div>
                  <label className="label">Precio de venta</label>
                  <input type="number" value={form.salePrice} min={0} step={100}
                    onChange={e => update('salePrice', Number(e.target.value))} className="input font-bold text-lg" />
                </div>
                <div>
                  <label className="label">Precio mayorista</label>
                  <input type="number" value={form.wholesalePrice} min={0} step={100}
                    onChange={e => update('wholesalePrice', Number(e.target.value))} className="input" />
                </div>
              </div>

              {/* VAT */}
              <div className="card p-4 bg-surface-50 dark:bg-surface-800/50 space-y-3">
                <h4 className="font-medium text-sm">Configuración de IVA</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Tipo de IVA</label>
                    <select value={form.vatType} onChange={e => {
                      const vat = VAT_TYPES.find(v => v.value === e.target.value);
                      update('vatType', e.target.value);
                      if (vat) update('vatRate', vat.rate);
                    }} className="input">
                      {VAT_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Tarifa de IVA (%)</label>
                    <input type="number" value={form.vatRate} min={0} max={100} step={1}
                      onChange={e => update('vatRate', Number(e.target.value))} className="input" />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.vatIncluded}
                    onChange={e => update('vatIncluded', e.target.checked)}
                    className="rounded text-primary-500" />
                  El precio de venta ya incluye IVA
                </label>
              </div>

              {/* Price summary */}
              <div className="card p-4 space-y-2">
                <h4 className="font-medium text-sm">Resumen de precios</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
                    <p className="text-xs text-surface-400">Precio base</p>
                    <p className="text-lg font-bold text-surface-700">${basePrice.toFixed(0)}</p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <p className="text-xs text-orange-500">IVA ({form.vatRate}%)</p>
                    <p className="text-lg font-bold text-orange-600">${vatAmount.toFixed(0)}</p>
                  </div>
                  <div className="p-3 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
                    <p className="text-xs text-accent-500">Total al consumidor</p>
                    <p className="text-lg font-bold text-accent-600">${finalPrice.toFixed(0)}</p>
                  </div>
                </div>
                {form.purchasePrice > 0 && (
                  <div className="text-center text-sm mt-2">
                    <span className="text-surface-400">Margen: </span>
                    <span className={cn('font-medium', margin > 30 ? 'text-accent-500' : margin > 15 ? 'text-yellow-500' : 'text-red-500')}>
                      {margin.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Inventory */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm mb-4">
                <input type="checkbox" checked={form.manageInventory}
                  onChange={e => update('manageInventory', e.target.checked)}
                  className="rounded text-primary-500" />
                Controlar stock de este producto
              </label>

              {form.manageInventory && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Stock mínimo</label>
                    <input type="number" value={form.stockMin} min={0} step={1}
                      onChange={e => update('stockMin', Number(e.target.value))} className="input" />
                  </div>
                  <div>
                    <label className="label">Stock máximo</label>
                    <input type="number" value={form.stockMax} min={0} step={1}
                      onChange={e => update('stockMax', Number(e.target.value))} className="input" />
                  </div>
                  <div>
                    <label className="label">Punto de reorden</label>
                    <input type="number" value={form.reorderPoint} min={0} step={1}
                      onChange={e => update('reorderPoint', Number(e.target.value))} className="input" />
                  </div>
                  <div>
                    <label className="label">Peso unitario (kg)</label>
                    <input type="number" value={form.weight} min={0} step={0.001}
                      onChange={e => update('weight', Number(e.target.value))} className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={form.expirationControl}
                        onChange={e => update('expirationControl', e.target.checked)}
                        className="rounded text-primary-500" />
                      Manejar lotes con fecha de vencimiento
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Images */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              {/* Image grid: existing + new */}
              {(existingImages.length > 0 || newImages.length > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* Existing images from server */}
                  {existingImages.map(img => (
                    <div key={img.id} className="group relative aspect-square bg-surface-100 dark:bg-surface-800 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
                      <img
                        src={img.imageUrl}
                        alt="Producto"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="24">📷</text></svg>';
                        }}
                      />

                      {/* Primary badge */}
                      {img.primary && (
                        <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                          <Star size={10} fill="currentColor" /> Principal
                        </div>
                      )}

                      {/* Actions overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        {!img.primary && (
                          <button
                            onClick={() => setPrimaryMutation.mutate(img.id)}
                            className="p-2 bg-white/90 hover:bg-white rounded-lg shadow text-surface-600 hover:text-yellow-500 transition-colors"
                            title="Establecer como principal"
                          >
                            <Star size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar esta imagen?')) {
                              deleteImageMutation.mutate(img.id);
                            }
                          }}
                          className="p-2 bg-white/90 hover:bg-white rounded-lg shadow text-red-500 hover:text-red-600 transition-colors"
                          title="Eliminar imagen"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* New images pending upload */}
                  {newImages.map((ni, index) => (
                    <div key={index} className="relative aspect-square bg-surface-100 dark:bg-surface-800 rounded-xl overflow-hidden border-2 border-dashed border-primary-400">
                      <img src={ni.previewUrl} alt="Nueva imagen" className="w-full h-full object-cover" />

                      {/* Uploading overlay */}
                      {ni.uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 size={24} className="text-white animate-spin" />
                        </div>
                      )}

                      {/* Remove button (only if not uploading) */}
                      {!ni.uploading && (
                        <button
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition-colors"
                          title="Cancelar"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add more placeholder */}
                  {canAddMore && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl flex flex-col items-center justify-center gap-2 text-surface-400 hover:border-primary-400 hover:text-primary-500 transition-all hover:bg-primary-50/50 dark:hover:bg-primary-900/10"
                    >
                      <Upload size={24} />
                      <span className="text-xs font-medium">Agregar</span>
                    </button>
                  )}
                </div>
              )}

              {/* Drop zone (shown when no images yet or always if space allows) */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'relative border-2 border-dashed rounded-xl py-12 px-6 text-center cursor-pointer transition-all',
                  dragOver
                    ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/10'
                    : existingImages.length > 0 || newImages.length > 0
                      ? 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                      : 'border-surface-300 dark:border-surface-600 hover:border-primary-400',
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFileSelect(e.target.files);
                    e.target.value = '';
                  }}
                />

                <div className={cn(
                  'flex flex-col items-center gap-2',
                  dragOver ? 'text-primary-500' : 'text-surface-400'
                )}>
                  {dragOver ? (
                    <>
                      <Upload size={40} className="text-primary-500" />
                      <p className="font-medium text-primary-600">Suelta las imágenes aquí</p>
                    </>
                  ) : (
                    <>
                      <Image size={40} className="opacity-40" />
                      <p className="font-medium">
                        {totalImages > 0 ? 'Arrastra más imágenes o haz clic para agregar' : 'Arrastra imágenes aquí o haz clic para subirlas'}
                      </p>
                    </>
                  )}
                  <p className="text-xs">
                    JPG, PNG, WEBP · Máx 5MB · {totalImages}/5 imágenes
                  </p>
                </div>
              </div>

              {/* Upload button for new images */}
              {newImages.length > 0 && id && (
                <div className="flex justify-end">
                  <button
                    onClick={() => uploadNewImages(id!)}
                    disabled={uploadingCount > 0}
                    className="btn-primary"
                  >
                    {uploadingCount > 0 ? (
                      <><Loader2 size={16} className="animate-spin" /> Subiendo...</>
                    ) : (
                      <><Upload size={16} /> Subir {newImages.length} imagen(es)</>
                    )}
                  </button>
                </div>
              )}

              {/* Info for new product (must save first) */}
              {!isEditing && newImages.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium">📸 Las imágenes se subirán después de guardar el producto</p>
                  <p className="mt-1 text-yellow-600 dark:text-yellow-400">
                    Primero crea el producto, luego podrás subir las imágenes desde la edición.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating save panel */}
      <div className="card p-4 sticky bottom-4 flex items-center justify-between">
        <div className="text-sm">
          {form.name ? (
            <span className="font-medium">{form.name}</span>
          ) : (
            <span className="text-surface-400">Producto sin nombre</span>
          )}
          {form.salePrice > 0 && <span className="text-surface-400 ml-3">| {formatCurrency(form.salePrice)}</span>}
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/productos')} className="btn-secondary">Cancelar</button>
          <button onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending} className="btn-primary">
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEditing ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </div>
  );
}
