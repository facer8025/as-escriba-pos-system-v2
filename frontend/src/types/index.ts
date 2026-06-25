// ========== Auth & Users ==========
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  username?: string;
  phone?: string;
  avatarUrl?: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  branchId?: string;
  branchName?: string;
  active: boolean;
  mustChangePassword: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  roleName: string;
  avatarUrl?: string;
  companyId?: string;
  companyName?: string;
  branchId?: string;
  branchName?: string;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  mustChangePassword: boolean;
  expiresIn: number;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

// ========== Products ==========
export interface Product {
  id: string;
  internalCode?: string;
  barcode?: string;
  name: string;
  shortName?: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  brandId?: number;
  brandName?: string;
  unitCode?: string;
  unitName?: string;
  status: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice?: number;
  vatType: string;
  vatRate: number;
  vatIncluded: boolean;
  manageInventory: boolean;
  currentStock: number;
  avgCost: number;
  stockMin: number;
  stockMax: number;
  reorderPoint: number;
  weight?: number;
  expirationControl?: boolean;
  mainImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== Customers ==========
export interface Customer {
  id: string;
  companyId: string;
  documentType?: { id: number; code: string; name: string };
  documentNumber?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  customerType: string;
  creditLimit: number;
  pointsBalance: number;
  totalPurchases: number;
  active: boolean;
}

// ========== Sales ==========
export interface Sale {
  id: string;
  companyId: string;
  branchId?: string;
  saleNumber: string;
  customerId?: string;
  customer?: Customer;
  sessionId?: string;
  sellerId?: string;
  seller?: User;
  subtotal: number;
  discountType?: string;
  discountValue: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  status: string;
  documentType: string;
  notes?: string;
  items: SaleItem[];
  payments: SalePayment[];
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discountType?: string;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  notes?: string;
}

export interface SalePayment {
  id: string;
  paymentMethodId: number;
  paymentMethod?: { code: string; name: string };
  reference?: string;
  amount: number;
  changeAmount: number;
}

// ========== Suppliers ==========
export interface Supplier {
  id: string;
  companyId: string;
  documentNumber?: string;
  businessName: string;
  tradeName?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  city?: { id: number; name: string };
  active: boolean;
  paymentTerm?: string;
  rating?: number;
}

// ========== Purchase Orders ==========
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: Supplier;
  orderDate: string;
  expectedDate?: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  items: PurchaseOrderItem[];
  notesSupplier?: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  product: Product;
  quantity: number;
  quantityReceived: number;
  unitCost: number;
  subtotal: number;
  total: number;
}

// ========== Inventory ==========
export interface InventoryMovement {
  id: string;
  productId: string;
  productName?: string;
  warehouseId?: string;
  movementType: string;
  referenceType?: string;
  referenceId?: string;
  quantity: number;
  unitCost: number;
  stockBefore: number;
  stockAfter: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

// ========== Cash Session ==========
export interface CashSession {
  id: string;
  registerId: string;
  registerName?: string;
  userId: string;
  userName?: string;
  openedAt: string;
  openingAmount: number;
  closedAt?: string;
  closingAmount?: number;
  countedAmount?: number;
  differenceAmount?: number;
  cashWithdrawn?: number;
  baseForNextSession?: number;
  status: string;
  totalSales: number;
  totalSalesAmount: number;
}

// ========== Customers ==========
export interface Customer {
  id: string;
  companyId: string;
  documentType?: { id: number; code: string; name: string };
  documentNumber?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  customerType: string;
  creditLimit: number;
  pointsBalance: number;
  totalPurchases: number;
  active: boolean;
}

// ========== Payment Methods ==========
export interface PaymentMethod {
  id: number;
  code: string;
  name: string;
  icon?: string;
  isCash?: boolean;
  requiresReference?: boolean;
  requiresApproval?: boolean;
  active: boolean;
}

// ========== Dashboard ==========
export interface DashboardSummary {
  todaySales: number;
  todayTransactions: number;
  yesterdaySales: number;
  salesTrend: number;
  outOfStock: number;
  inventoryValue: number;
}

// ========== API ==========
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ========== Categories ==========
export interface Category {
  id: string;
  parentId?: string;
  companyId: string;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  createdAt: string;
}

// ========== Navigation ==========
export interface NavItem {
  label: string;
  path?: string;
  icon: string;
  roles?: string[];
  children?: NavItem[];
}
