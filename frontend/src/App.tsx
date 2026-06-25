import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useEffect } from 'react';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import POSLayout from '@/layouts/POSLayout';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProductsCatalogPage from '@/pages/products/ProductsCatalogPage';
import POSPage from '@/pages/pos/POSPage';
import UsersPage from '@/pages/configuracion/UsersPage';
import InventorySummaryPage from '@/pages/inventory/InventorySummaryPage';
import InventoryEntryPage from '@/pages/inventory/InventoryEntryPage';
import InventoryExitPage from '@/pages/inventory/InventoryExitPage';
import InventoryAdjustmentPage from '@/pages/inventory/InventoryAdjustmentPage';
import PurchaseOrderListPage from '@/pages/suppliers/PurchaseOrderListPage';
import PurchaseOrderCreatePage from '@/pages/suppliers/PurchaseOrderCreatePage';
import PurchaseOrderReceivePage from '@/pages/suppliers/PurchaseOrderReceivePage';
import CashClosePage from '@/pages/pos/cash/CashClosePage';
import SupplierListPage from '@/pages/suppliers/SupplierListPage';
import ReportsHubPage from '@/pages/reportes/ReportsHubPage';
import SalesReportPage from '@/pages/reportes/SalesReportPage';
import InventoryReportPage from '@/pages/reportes/InventoryReportPage';
import POSHistoryPage from '@/pages/pos/cash/POSHistoryPage';
import ProductFormPage from '@/pages/products/ProductFormPage';
import ProductDetailPage from '@/pages/products/ProductDetailPage';
import ReturnsPage from '@/pages/pos/ReturnsPage';
import InvoicesPage from '@/pages/facturacion/InvoicesPage';
import DianConfigPage from '@/pages/facturacion/DianConfigPage';
import CompanyConfigPage from '@/pages/configuracion/CompanyConfigPage';
import SystemParamsPage from '@/pages/configuracion/SystemParamsPage';
import CashOpenPage from '@/pages/pos/cash/CashOpenPage';
import SupplierFormPage from '@/pages/suppliers/SupplierFormPage';
import KardexPage from '@/pages/inventory/KardexPage';
import ProfilePage from '@/pages/auth/ProfilePage';
import CategoriesPage from '@/pages/products/CategoriesPage';
import StockAlertsPage from '@/pages/inventory/StockAlertsPage';
import CatalogsPage from '@/pages/configuracion/CatalogsPage';
import NotificationConfigPage from '@/pages/configuracion/NotificationConfigPage';
import PaymentMethodsPage from '@/pages/configuracion/PaymentMethodsPage';
import BranchesPage from '@/pages/configuracion/BranchesPage';
import SupplierDetailPage from '@/pages/suppliers/SupplierDetailPage';
import CustomersListPage from '@/pages/clientes/CustomersListPage';

// Lazy-loaded pages (placeholder)
import PlaceholderPage from '@/pages/shared/PlaceholderPage';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { theme, setTheme } = useUIStore();

  // Initialize theme on mount
  useEffect(() => {
    setTheme(theme);
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar-contrasena" element={<PlaceholderPage title="Recuperar contraseña" />} />
      <Route path="/restablecer-contrasena" element={<PlaceholderPage title="Restablecer contraseña" />} />

      {/* Protected routes with MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Module 1: Users & Profile */}
        <Route path="/configuracion/usuarios" element={<UsersPage />} />
        <Route path="/perfil" element={<ProfilePage />} />

        {/* Module 2: Products */}
        <Route path="/productos" element={<ProductsCatalogPage />} />
        <Route path="/productos/nuevo" element={<ProductFormPage />} />
        <Route path="/productos/:id" element={<ProductDetailPage />} />
        <Route path="/productos/:id/editar" element={<ProductFormPage />} />
        <Route path="/productos/categorias" element={<CategoriesPage />} />

        {/* Module 3: Inventory */}
        <Route path="/inventario" element={<InventorySummaryPage />} />
        <Route path="/inventario/entradas/nueva" element={<InventoryEntryPage />} />
        <Route path="/inventario/salidas/nueva" element={<InventoryExitPage />} />
        <Route path="/inventario/ajustes/toma" element={<InventoryAdjustmentPage />} />
        <Route path="/inventario/kardex" element={<KardexPage />} />
        <Route path="/inventario/alertas" element={<StockAlertsPage />} />
        <Route path="/inventario/traslados" element={<PlaceholderPage title="Traslados" />} />

        {/* Module 7: Suppliers */}
        <Route path="/proveedores" element={<SupplierListPage />} />
        <Route path="/proveedores/nuevo" element={<SupplierFormPage />} />
        <Route path="/proveedores/:id" element={<SupplierDetailPage />} />
        <Route path="/proveedores/ordenes" element={<PurchaseOrderListPage />} />
        <Route path="/proveedores/ordenes/nueva" element={<PurchaseOrderCreatePage />} />
        <Route path="/proveedores/ordenes/:id/recibir" element={<PurchaseOrderReceivePage />} />

        {/* Module 5: Invoicing */}
        <Route path="/facturacion/facturas" element={<InvoicesPage />} />
        <Route path="/facturacion/configuracion" element={<DianConfigPage />} />

        {/* Module 9: Reports */}
        <Route path="/reportes" element={<ReportsHubPage />} />
        <Route path="/reportes/ventas" element={<SalesReportPage />} />
        <Route path="/reportes/cierre-caja" element={<Navigate to="/pos/cierre" replace />} />
        <Route path="/reportes/inventario" element={<InventoryReportPage />} />

        {/* Module: Customers */}
        <Route path="/clientes" element={<CustomersListPage />} />

        {/* Module 10: Configuration */}
        <Route path="/configuracion/empresa" element={<CompanyConfigPage />} />
        <Route path="/configuracion/medios-pago" element={<PaymentMethodsPage />} />
        <Route path="/configuracion/parametros" element={<SystemParamsPage />} />
        <Route path="/configuracion/catalogos" element={<CatalogsPage />} />
        <Route path="/configuracion/notificaciones" element={<NotificationConfigPage />} />
        <Route path="/configuracion/sucursales" element={<BranchesPage />} />
      </Route>

      {/* POS - full screen without MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <POSLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/pos" element={<POSPage />} />
        <Route path="/pos/apertura" element={<CashOpenPage />} />
        <Route path="/pos/historial" element={<POSHistoryPage />} />
        <Route path="/pos/devoluciones" element={<ReturnsPage />} />
        <Route path="/pos/cierre" element={<CashClosePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
