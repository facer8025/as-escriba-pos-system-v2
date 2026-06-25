import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Search, ShoppingCart, X, Plus, Minus, User, CreditCard,
  Printer, Pause, Trash2, Percent, DollarSign, Camera,
  Package, LayoutDashboard, Receipt, FileText, Loader2,
  CheckCircle, Building2, Play, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { ApiResponse, PageResponse, Product, Customer } from '@/types';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
  discount: number;
  discountType: '%' | '$';
  subtotal: number;
  vatType: string;
  vatRate: number;
  vatIncluded: boolean;
  basePrice: number;     // Precio sin IVA
  vatAmount: number;     // Monto de IVA del ítem
}

interface PaymentLine {
  method: string;
  methodName: string;
  reference: string;
  amount: number;
}

interface PausedSale {
  id: string;
  items: CartItem[];
  customer: SelectedCustomer | null;
  globalDiscount: number;
  globalDiscountType: '%' | '$';
  documentType: 'TICKET' | 'INVOICE';
  timestamp: number;
  itemCount: number;
  total: number;
}

interface SelectedCustomer {
  id: string;
  name: string;
  documentNumber?: string;
  documentType?: string;
  email?: string;
  phone?: string;
}

// Cálculos de IVA según normativa colombiana
function calcItemTotals(price: number, quantity: number, vatRate: number, vatIncluded: boolean) {
  let basePrice: number;
  let vatAmount: number;

  if (vatIncluded) {
    basePrice = price / (1 + vatRate / 100);
    vatAmount = price - basePrice;
  } else {
    basePrice = price;
    vatAmount = price * (vatRate / 100);
  }

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    vatAmount: Math.round(vatAmount * quantity * 100) / 100,
    subtotal: Math.round((vatIncluded ? price : price + vatAmount) * quantity * 100) / 100,
  };
}

function vatLabel(vatType: string, vatRate: number): string {
  switch (vatType) {
    case 'EXCLUDED': return 'Excluido';
    case 'EXEMPT': return 'Exento';
    case 'REDUCED': return `${vatRate}%`;
    case 'STANDARD': return `${vatRate}%`;
    default: return `${vatRate}%`;
  }
}

function vatBadgeClass(vatType: string): string {
  switch (vatType) {
    case 'EXCLUDED': return 'badge-neutral';
    case 'EXEMPT': return 'badge-info';
    case 'REDUCED': return 'badge-warning';
    case 'STANDARD': return 'badge-success';
    default: return 'badge-neutral';
  }
}

export default function POSPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<SelectedCustomer | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalDiscountType, setGlobalDiscountType] = useState<'%' | '$'>('%');
  const [showPayment, setShowPayment] = useState(false);
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [documentType, setDocumentType] = useState<'TICKET' | 'INVOICE'>('TICKET');
  const [submitting, setSubmitting] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    documentType: 'CC',
    documentNumber: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    customerType: 'RETAIL',
  });

  // Ventas en espera (persistidas en localStorage)
  const [pausedSales, setPausedSales] = useState<PausedSale[]>(() => {
    try {
      const saved = localStorage.getItem('escriba-paused-sales');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showPausedPanel, setShowPausedPanel] = useState(false);

  // Persistir ventas en espera en localStorage
  useEffect(() => {
    localStorage.setItem('escriba-paused-sales', JSON.stringify(pausedSales));
  }, [pausedSales]);

  // Focus search on load + atajos de teclado
  useEffect(() => {
    searchRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevenir que F1 abra la ayuda del navegador
      if (e.key === 'F1' || e.key === 'F4' || e.key === 'F9' || e.key === 'F12') {
        e.preventDefault();
      }

      switch (e.key) {
        case 'F1':
          searchRef.current?.focus();
          break;
        case 'F4':
          setShowCustomerSearch((prev) => !prev);
          break;
        case 'F9':
          if (cart.length > 0) {
            handlePauseSale();
          }
          break;
        case 'F12':
          if (cart.length > 0 && !showPayment) {
            setShowPayment(true);
          }
          break;
        case 'Escape':
          if (showPayment) {
            setShowPayment(false);
          } else if (showCustomerSearch) {
            setShowCustomerSearch(false);
          } else if (cart.length > 0) {
            if (window.confirm('¿Cancelar la venta actual?')) {
              setCart([]);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, showPayment, showCustomerSearch]);

  // Buscar productos
  const { data: searchData } = useQuery({
    queryKey: ['pos-products', user?.companyId, searchTerm, selectedCategoryId, showAllProducts],
    queryFn: () =>
      api.get<ApiResponse<PageResponse<Product>>>('/products', {
        params: {
          companyId: user?.companyId,
          search: searchTerm || undefined,
          categoryId: selectedCategoryId || undefined,
          page: 0,
          size: 20,
          sortBy: 'name',
          sortDir: 'asc',
        },
      }),
    enabled: (searchTerm.length >= 1 || !!selectedCategoryId || showAllProducts) && !!user?.companyId,
  });

  // Buscar categorías para los botones de acceso rápido
  const { data: categoriesData } = useQuery({
    queryKey: ['pos-categories', user?.companyId],
    queryFn: () =>
      api.get<ApiResponse<Array<{ id: string; name: string; color: string }>>>('/categories', {
        params: { companyId: user?.companyId, active: true },
      }),
    enabled: !!user?.companyId,
  });

  // Buscar clientes
  const { data: customerData } = useQuery({
    queryKey: ['customers-search', user?.companyId, customerSearchTerm],
    queryFn: () =>
      api.get<ApiResponse<Customer[]>>('/customers/search', {
        params: { companyId: user?.companyId, term: customerSearchTerm },
      }),
    enabled: customerSearchTerm.length >= 2 && !!user?.companyId,
  });

  const searchResults = searchData?.data?.data?.content || [];
  const customerResults = customerData?.data?.data || [];

  const addToCart = (product: Product) => {
    const { basePrice, vatAmount, subtotal } = calcItemTotals(
      product.salePrice, 1, product.vatRate, product.vatIncluded
    );

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) => {
          if (item.productId !== product.id) return item;
          const newQty = item.quantity + 1;
          const totals = calcItemTotals(product.salePrice, newQty, product.vatRate, product.vatIncluded);
          return { ...item, quantity: newQty, subtotal: totals.subtotal, basePrice: totals.basePrice, vatAmount: totals.vatAmount };
        });
      }
      return [
        ...prev,
        {
          id: product.id,
          productId: product.id,
          name: product.name,
          code: product.internalCode || product.barcode || '',
          price: product.salePrice,
          quantity: 1,
          discount: 0,
          discountType: '%' as '%',
          subtotal,
          vatType: product.vatType,
          vatRate: product.vatRate,
          vatIncluded: product.vatIncluded,
          basePrice,
          vatAmount,
        },
      ];
    });
    setSearchTerm('');
    searchRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = Math.max(0, item.quantity + delta);
          if (newQty === 0) return null;
          const totals = calcItemTotals(item.price, newQty, item.vatRate, item.vatIncluded);
          return { ...item, quantity: newQty, subtotal: totals.subtotal, basePrice: totals.basePrice, vatAmount: totals.vatAmount };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handlePauseSale = () => {
    if (cart.length === 0) {
      toast.error('No hay productos en la venta para pausar');
      return;
    }

    const paused: PausedSale = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      items: [...cart],
      customer,
      globalDiscount,
      globalDiscountType,
      documentType,
      timestamp: Date.now(),
      itemCount: calcTotalItems(),
      total: calcTotal(),
    };

    setPausedSales((prev) => [paused, ...prev]);

    // Limpiar el POS para nueva venta
    setCart([]);
    setCustomer(null);
    setGlobalDiscount(0);
    setGlobalDiscountType('%');

    toast.success(`Venta pausada — ${paused.itemCount} productos, ${formatCurrency(paused.total)}`);
    searchRef.current?.focus();
  };

  const handleResumeSale = (pausedId: string) => {
    const paused = pausedSales.find((p) => p.id === pausedId);
    if (!paused) return;

    setCart(paused.items);
    setCustomer(paused.customer);
    setGlobalDiscount(paused.globalDiscount);
    setGlobalDiscountType(paused.globalDiscountType);
    setDocumentType(paused.documentType);

    // Remover de la lista de pausadas
    setPausedSales((prev) => prev.filter((p) => p.id !== pausedId));
    setShowPausedPanel(false);

    toast.success('Venta reanudada');
  };

  const handleDeletePausedSale = (pausedId: string) => {
    setPausedSales((prev) => prev.filter((p) => p.id !== pausedId));
    toast.success('Venta en espera descartada');
  };

  const formatPausedTime = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `Hace ${hours}h ${minutes % 60}m`;
  };

  const setCartQuantity = (productId: string, newQty: number) => {
    if (newQty < 1) {
      removeItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const totals = calcItemTotals(item.price, newQty, item.vatRate, item.vatIncluded);
        return { ...item, quantity: newQty, subtotal: totals.subtotal, basePrice: totals.basePrice, vatAmount: totals.vatAmount };
      })
    );
  };

  // --- Cálculos fiscales ---
  const calcSubtotalBase = () => cart.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
  const calcSubtotalItems = () => cart.reduce((sum, item) => sum + item.subtotal, 0);
  const calcDiscountTotal = () => {
    const subtotal = calcSubtotalBase();
    if (globalDiscountType === '%') return subtotal * (globalDiscount / 100);
    return Math.min(globalDiscount, subtotal);
  };

  const calcVatByRate = () => {
    const vatMap = new Map<string, { rate: number; base: number; amount: number; type: string }>();

    for (const item of cart) {
      const key = `${item.vatType}-${item.vatRate}`;
      const existing = vatMap.get(key) || { rate: item.vatRate, base: 0, amount: 0, type: item.vatType };
      existing.base += item.basePrice * item.quantity;
      existing.amount += item.vatAmount;
      vatMap.set(key, existing);
    }

    const discount = calcDiscountTotal();
    const baseTotal = calcSubtotalBase();
    if (discount > 0 && baseTotal > 0) {
      const discountRatio = discount / baseTotal;
      for (const [, v] of vatMap) {
        v.base -= v.base * discountRatio;
        v.amount -= v.amount * discountRatio;
      }
    }

    return Array.from(vatMap.values());
  };

  const calcTotal = () => {
    const subtotal = calcSubtotalBase();
    const discount = calcDiscountTotal();
    const vatTotal = calcVatByRate().reduce((s, v) => s + v.amount, 0);
    return subtotal - discount + vatTotal;
  };

  const calcTotalItems = () => cart.reduce((s, i) => s + i.quantity, 0);

  const handleConfirmPayment = async () => {
    if (!user?.companyId || !user?.userId) {
      toast.error('Sesión no válida. Inicia sesión nuevamente.');
      return;
    }
    if (payments.length === 0) {
      toast.error('Debes agregar al menos un medio de pago');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        companyId: user.companyId,
        branchId: user.branchId || undefined,
        customerId: customer?.id || undefined,
        sellerId: user.userId,
        documentType,
        discountType: globalDiscount > 0 ? globalDiscountType : undefined,
        discountValue: globalDiscount > 0 ? globalDiscount : 0,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.price,
          taxRate: item.vatRate,
          taxAmount: item.vatAmount,
          subtotal: item.subtotal,
          total: item.subtotal,
        })),
        payments: payments.map((p) => ({
          paymentMethodCode: p.method,
          reference: p.reference || undefined,
          amount: p.amount,
        })),
      };

      const response = await api.post<ApiResponse<{ id: string; saleNumber: string }>>('/sales', payload);

      if (response.data.success) {
        toast.success(`Venta ${response.data.data?.saleNumber || ''} registrada exitosamente`);
        // Limpiar carrito y cerrar modal
        setCart([]);
        setPayments([]);
        setCustomer(null);
        setGlobalDiscount(0);
        setShowPayment(false);
        // Invalidar queries relacionadas para refrescar datos
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      } else {
        toast.error(response.data.message || 'Error al registrar la venta');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Error de conexión al guardar la venta';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const createCustomer = async () => {
    if (!newCustomerForm.name.trim() || !newCustomerForm.documentNumber.trim()) {
      toast.error('Nombre y número de documento son requeridos');
      return;
    }
    try {
      const response = await api.post<ApiResponse<Customer>>('/customers', {
        companyId: user?.companyId,
        name: newCustomerForm.name,
        documentNumber: newCustomerForm.documentNumber,
        documentType: newCustomerForm.documentType,
        phone: newCustomerForm.phone || undefined,
        email: newCustomerForm.email || undefined,
        address: newCustomerForm.address || undefined,
        customerType: newCustomerForm.customerType,
      });
      if (response.data.success) {
        const c = response.data.data;
        setCustomer({
          id: c.id,
          name: c.name,
          documentNumber: c.documentNumber,
          email: c.email,
          phone: c.phone,
        });
        setShowNewCustomer(false);
        setShowCustomerSearch(false);
        toast.success('Cliente creado y seleccionado');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear cliente');
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-0 overflow-hidden">
      {/* Left Panel - Search */}
      <div className="w-[30%] bg-[#f7f4f0] dark:bg-[#0d0d24] border-r border-surface-100 dark:border-surface-800 p-4 flex flex-col">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Escanea o busca el producto..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value) {
                setSelectedCategoryId(undefined);
                setShowAllProducts(false);
              }
            }}
            className="input pl-9 h-12 text-lg"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
            <Camera size={18} />
          </button>
        </div>

        {/* Category shortcuts - real categories from API */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(categoriesData?.data?.data || []).slice(0, 5).map((cat) => (
            <button key={cat.id} onClick={() => {
              setSelectedCategoryId(selectedCategoryId === cat.id ? undefined : cat.id);
              setSearchTerm('');
              setShowAllProducts(false);
              searchRef.current?.focus();
            }}
              className={cn('px-3 py-2 text-xs font-medium rounded-lg transition-all truncate',
                selectedCategoryId === cat.id
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400')}>
              {cat.name}
            </button>
          ))}
          <button onClick={() => {
            setSelectedCategoryId(undefined);
            setSearchTerm('');
            setShowAllProducts(true);
            searchRef.current?.focus();
          }}
            className={cn('px-3 py-2 text-xs font-medium rounded-lg transition-all',
              showAllProducts
                ? 'bg-primary-500 text-white shadow-soft'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400')}>
            Ver todo
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {(searchTerm.length > 0 || selectedCategoryId || showAllProducts) && searchResults.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800
                       transition-all group border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
            >
              <div className="w-12 h-12 bg-surface-100 dark:bg-surface-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package size={20} className="text-surface-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{product.name}</p>
                <p className="text-xs text-surface-400">{product.internalCode}</p>
                <span className={cn('badge text-[10px] mt-0.5', vatBadgeClass(product.vatType))}>
                  IVA {vatLabel(product.vatType, product.vatRate)}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(product.salePrice)}
                </p>
                <p className={cn('text-xs',
                  product.currentStock <= 0 ? 'text-red-500' :
                  product.currentStock <= product.stockMin ? 'text-yellow-500' : 'text-surface-400'
                )}>
                  {product.currentStock.toFixed(0)} und
                </p>
              </div>
            </button>
          ))}
          {searchTerm.length === 0 && !selectedCategoryId && !showAllProducts && (
            <div className="text-center py-12 text-surface-400">
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Busca o escanea un producto</p>
              <p className="text-xs mt-1">F1 para enfocar búsqueda</p>
            </div>
          )}
          {(searchTerm.length > 0 || selectedCategoryId || showAllProducts) && searchResults.length === 0 && (
            <div className="text-center py-12 text-surface-400">
              <p className="text-sm">
                {showAllProducts
                  ? 'No hay productos registrados'
                  : selectedCategoryId
                    ? 'No hay productos en esta categoría'
                    : `Sin resultados para "${searchTerm}"`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Center Panel - Cart */}
      <div className="w-[45%] bg-[#f7f4f0] dark:bg-[#0d0d24] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-800">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-surface-900 dark:text-white">Ítems de la venta</h2>
            {cart.length > 0 && (
              <span className="badge-neutral text-xs">{calcTotalItems()} und</span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="btn-ghost text-red-500 text-sm p-1.5">
              <Trash2 size={16} /> Limpiar
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.map((item) => (
            <div key={item.productId} className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-surface-400">{formatCurrency(item.price)} c/u</p>
                  <span className={cn('badge text-[10px]', vatBadgeClass(item.vatType))}>
                    {vatLabel(item.vatType, item.vatRate)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700">
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setCartQuantity(item.productId, val);
                  }}
                  onBlur={(e) => {
                    if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                      setCartQuantity(item.productId, 1);
                    }
                  }}
                  className="w-12 text-center font-medium text-sm bg-transparent border border-surface-200 dark:border-surface-600 rounded-md py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700">
                  <Plus size={14} />
                </button>
              </div>
              <div className="text-right min-w-[80px]">
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
              <button onClick={() => removeItem(item.productId)} className="p-1 text-surface-400 hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex items-center justify-center text-surface-400">
              <div className="text-center">
                <ShoppingCart size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">Busca o escanea un producto</p>
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-surface-200 dark:border-surface-800 p-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Base (sin IVA)</span>
              <span>{formatCurrency(calcSubtotalBase())}</span>
            </div>
            {calcDiscountTotal() > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Descuento</span>
                <span>-{formatCurrency(calcDiscountTotal())}</span>
              </div>
            )}
            {calcVatByRate().map((v) => (
              <div key={`${v.type}-${v.rate}`} className="flex justify-between text-sm">
                <span className="text-surface-500">
                  IVA {v.type === 'EXCLUDED' ? 'Excluido' : v.type === 'EXEMPT' ? 'Exento' : `${v.rate}%`}
                </span>
                <span className={cn(
                  v.type === 'STANDARD' ? 'text-orange-600' :
                  v.type === 'REDUCED' ? 'text-yellow-600' : 'text-surface-400'
                )}>
                  {v.type === 'EXCLUDED' || v.type === 'EXEMPT' ? '$0' : formatCurrency(v.amount)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-surface-200 dark:border-surface-700">
              <span>TOTAL</span>
              <span className="text-primary-600 dark:text-primary-400">
                {formatCurrency(calcTotal())}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Payment */}
      <div className="w-[25%] bg-surface-50 dark:bg-[#0a0a18] p-4 flex flex-col">
        <div className="mb-4">
          <label className="label">Cliente</label>
          <div className="relative">
            <button
              onClick={() => setShowCustomerSearch(!showCustomerSearch)}
              className="w-full input text-left flex items-center justify-between"
            >
              {customer ? (
                <span className="truncate">{customer.name}</span>
              ) : (
                <span className="text-surface-400">Consumidor Final (CF)</span>
              )}
              <User size={16} className="text-surface-400 flex-shrink-0" />
            </button>

            {showCustomerSearch && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#13132b] border border-surface-200 dark:border-surface-700 rounded-xl shadow-lg p-3 space-y-2">
                <input
                  type="text"
                  placeholder="Buscar por nombre o documento..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="input text-sm"
                  autoFocus
                />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCustomer({
                          id: c.id,
                          name: c.name,
                          documentNumber: c.documentNumber,
                          documentType: c.documentType?.code,
                          email: c.email,
                          phone: c.phone,
                        });
                        setShowCustomerSearch(false);
                        setCustomerSearchTerm('');
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-sm"
                    >
                      <p className="font-medium text-surface-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-surface-400">{c.documentNumber} · {c.phone || '—'}</p>
                    </button>
                  ))}
                  {customerSearchTerm.length >= 2 && customerResults.length === 0 && (
                    <p className="text-xs text-surface-400 text-center py-2">Sin resultados</p>
                  )}
                </div>
                <button
                  onClick={() => { setShowNewCustomer(true); setShowCustomerSearch(false); }}
                  className="w-full text-center text-sm text-primary-500 hover:text-primary-600 font-medium py-1"
                >
                  + Nuevo cliente
                </button>
                {customer && (
                  <button
                    onClick={() => { setCustomer(null); setShowCustomerSearch(false); }}
                    className="w-full text-center text-sm text-red-500 hover:text-red-600 py-1"
                  >
                    Quitar cliente
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="label">Descuento global</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="number"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                className="input pl-8"
                placeholder="0"
              />
              {globalDiscountType === '%' ? (
                <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              ) : (
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              )}
            </div>
            <button
              onClick={() => setGlobalDiscountType(globalDiscountType === '%' ? '$' : '%')}
              className="btn-secondary px-3 text-sm"
            >
              {globalDiscountType === '%' ? '%' : '$'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end">
          <div className="text-center mb-6">
            <p className="text-sm text-surface-500 mb-1">Total a cobrar</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {formatCurrency(calcTotal())}
            </p>
            <p className="text-xs text-surface-400 mt-1">
              {cart.length} productos · {calcTotalItems()} unidades
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
                       flex items-center justify-center gap-2 text-lg"
            >
              <CreditCard size={20} />
              Cobrar
              <kbd className="text-xs opacity-60 ml-2">F12</kbd>
            </button>
            <button onClick={handlePauseSale} disabled={cart.length === 0} className="w-full py-3 btn-secondary">
              <Pause size={16} />
              Pausar venta
              <kbd className="text-xs opacity-60 ml-2">F9</kbd>
            </button>
            {pausedSales.length > 0 && (
              <button onClick={() => setShowPausedPanel(true)} className="w-full py-2.5 btn-ghost text-primary-600 dark:text-primary-400 text-sm">
                <Clock size={14} />
                Ventas en espera ({pausedSales.length})
              </button>
            )}
            <button onClick={() => { if (cart.length > 0 && window.confirm('¿Cancelar la venta actual?')) { setCart([]); } }} className="w-full py-3 btn-ghost text-red-500">
              Cancelar venta
              <kbd className="text-xs opacity-60 ml-2">Esc</kbd>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            <p className="text-xs text-surface-400 text-center">
              F1: Buscar · F4: Cliente · F9: Pausar · F12: Cobrar
            </p>
          </div>

          <div className="mt-4">
            <Link to="/" className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium
                     text-surface-400 hover:text-primary-500 border border-dashed border-surface-300 dark:border-surface-600
                     rounded-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all">
              <LayoutDashboard size={16} />
              Volver al menú principal
            </Link>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal-content w-[80%] max-w-4xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">Procesar pago</h2>
              <button onClick={() => setShowPayment(false)} className="btn-ghost p-1">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Left - Summary */}
              <div>
                <h3 className="font-medium text-surface-900 dark:text-white mb-3">Resumen de venta</h3>

                {/* Tipo de documento selector */}
                <div className="mb-4 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                  <label className="label mb-2">Tipo de documento</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDocumentType('TICKET')}
                      className={cn('flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                        documentType === 'TICKET'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-300')}
                    >
                      <Receipt size={16} />
                      Ticket POS
                    </button>
                    <button
                      onClick={() => setDocumentType('INVOICE')}
                      className={cn('flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                        documentType === 'INVOICE'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'border-surface-200 dark:border-surface-700 text-surface-500 hover:border-surface-300')}
                    >
                      <FileText size={16} />
                      Factura electrónica
                    </button>
                  </div>
                  {documentType === 'INVOICE' && !customer && (
                    <p className="text-xs text-yellow-600 mt-2">Selecciona un cliente para facturar electrónicamente</p>
                  )}
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <div>
                        <span className="text-surface-600 dark:text-surface-400">
                          {item.name} x{item.quantity}
                        </span>
                        <span className={cn('badge text-[10px] ml-2', vatBadgeClass(item.vatType))}>
                          {vatLabel(item.vatType, item.vatRate)}
                        </span>
                      </div>
                      <span className="font-medium text-surface-900 dark:text-white">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-surface-200 dark:border-surface-700 mt-4 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">Base (sin IVA)</span>
                    <span className="text-surface-900 dark:text-white">{formatCurrency(calcSubtotalBase())}</span>
                  </div>
                  {calcDiscountTotal() > 0 && (
                    <div className="flex justify-between text-sm text-red-500">
                      <span>Descuento</span>
                      <span>-{formatCurrency(calcDiscountTotal())}</span>
                    </div>
                  )}
                  {calcVatByRate().map((v) => (
                    <div key={`pm-${v.type}-${v.rate}`} className="flex justify-between text-sm">
                      <span className="text-surface-500">
                        + IVA {v.type === 'EXCLUDED' ? 'Excluido' : v.type === 'EXEMPT' ? 'Exento' : `${v.rate}%`}
                      </span>
                      <span className={cn('text-surface-900 dark:text-white', v.type === 'STANDARD' ? 'text-orange-600 dark:text-orange-400' : '')}>
                        {v.type === 'EXCLUDED' || v.type === 'EXEMPT' ? '$0' : formatCurrency(v.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t dark:border-surface-700">
                    <span className="text-surface-900 dark:text-white">Total</span>
                    <span className="text-primary-600 dark:text-primary-400">{formatCurrency(calcTotal())}</span>
                  </div>
                </div>

                {customer && (
                  <div className="mt-3 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                    <p className="text-xs font-medium text-primary-600 dark:text-primary-400">{customer.name}</p>
                    <p className="text-[10px] text-primary-500/70">{customer.documentType} {customer.documentNumber}</p>
                  </div>
                )}
              </div>

              {/* Right - Payment Methods */}
              <div>
                <h3 className="font-medium text-surface-900 dark:text-white mb-3">¿Cómo va a pagar?</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { method: 'CASH', label: 'Efectivo', icon: DollarSign },
                    { method: 'DEBIT', label: 'Tarjeta Débito', icon: CreditCard },
                    { method: 'CREDIT', label: 'Tarjeta Crédito', icon: CreditCard },
                    { method: 'NEQUI', label: 'Nequi', icon: Receipt },
                    { method: 'TRANSFER', label: 'Transferencia', icon: Receipt },
                    { method: 'CREDIT_ACCOUNT', label: 'A crédito', icon: Building2 },
                  ].map((pm) => (
                    <button
                      key={pm.method}
                      onClick={() => setPayments([...payments, { method: pm.method, methodName: pm.label, reference: '', amount: calcTotal() }])}
                      className="flex items-center gap-2 p-3 rounded-xl border border-surface-200 dark:border-surface-700
                               hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                    >
                      <pm.icon size={18} className="text-surface-500" />
                      <span className="text-sm text-surface-700 dark:text-surface-300">{pm.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2 mb-4">
                  {payments.map((pm, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-surface-50 dark:bg-surface-800/50 rounded-lg">
                      <span className="text-sm font-medium text-surface-900 dark:text-white flex-1">{pm.methodName}</span>
                      <input
                        type="text"
                        placeholder="Referencia"
                        className="input text-xs py-1.5 w-28"
                        value={pm.reference}
                        onChange={(e) => {
                          const newPayments = [...payments];
                          newPayments[i].reference = e.target.value;
                          setPayments(newPayments);
                        }}
                      />
                      <span className="text-sm font-bold text-surface-900 dark:text-white">{formatCurrency(pm.amount)}</span>
                      <button onClick={() => setPayments(payments.filter((_, j) => j !== i))} className="text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={payments.length === 0 || submitting}
                  className="w-full py-3 btn-primary text-lg flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  {submitting ? 'Procesando...' : `Confirmar pago — ${formatCurrency(calcTotal())}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paused Sales Panel */}
      {showPausedPanel && (
        <div className="modal-overlay" onClick={() => setShowPausedPanel(false)}>
          <div className="modal-content w-[500px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                Ventas en espera
                <span className="text-sm font-normal text-surface-400 ml-2">({pausedSales.length})</span>
              </h2>
              <button onClick={() => setShowPausedPanel(false)} className="btn-ghost p-1">
                <X size={18} />
              </button>
            </div>

            {pausedSales.length === 0 ? (
              <div className="text-center py-8 text-surface-400">
                <ShoppingCart size={40} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay ventas en espera</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {pausedSales.map((ps) => (
                  <div key={ps.id} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                          {ps.itemCount} productos
                        </span>
                        <span className="text-xs text-surface-400">{formatPausedTime(ps.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {formatCurrency(ps.total)}
                        </span>
                        {ps.customer && (
                          <span className="text-xs text-surface-400 truncate">· {ps.customer.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleResumeSale(ps.id)}
                        className="btn-ghost p-2 text-primary-600 dark:text-primary-400"
                        title="Reanudar venta"
                      >
                        <Play size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePausedSale(ps.id)}
                        className="btn-ghost p-2 text-red-500"
                        title="Descartar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button onClick={() => setShowPausedPanel(false)} className="btn-secondary text-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustomer && (
        <div className="modal-overlay" onClick={() => setShowNewCustomer(false)}>
          <div className="modal-content w-[450px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">Nuevo cliente</h2>
              <button onClick={() => setShowNewCustomer(false)} className="btn-ghost p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo de ID</label>
                  <select
                    value={newCustomerForm.documentType}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, documentType: e.target.value })}
                    className="input"
                  >
                    <option value="CC">CC</option>
                    <option value="NIT">NIT</option>
                    <option value="CE">CE</option>
                    <option value="PASSPORT">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="label">Número</label>
                  <input
                    type="text"
                    placeholder="123456789"
                    value={newCustomerForm.documentNumber}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, documentNumber: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Nombre / Razón social</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Teléfono</label>
                  <input
                    type="text"
                    placeholder="3001234567"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    placeholder="cliente@mail.com"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowNewCustomer(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button onClick={createCustomer} className="btn-primary">
                  <User size={16} /> Guardar y seleccionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
