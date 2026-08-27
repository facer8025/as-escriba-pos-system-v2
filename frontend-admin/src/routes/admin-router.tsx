import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/admin-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { ProtectedRoute } from '@/auth/protected-route'
import { AdminRoleGuard } from '@/auth/admin-role-guard'
import { LoginPage } from '@/auth/login-page'
import { Login2FAPage } from '@/auth/login-2fa-page'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { EmpresasListPage } from '@/features/empresas/empresas-list-page'
import { EmpresaDetailPage } from '@/features/empresas/empresa-detail-page'
import { EmpresaCreatePage } from '@/features/empresas/empresa-create-page'
import { PlanesListPage } from '@/features/planes/planes-list-page'
import { PlanCreatePage } from '@/features/planes/plan-create-page'
import { LicenciasListPage } from '@/features/licencias/licencias-list-page'
import { FacturacionPage } from '@/features/facturacion/facturacion-page'
import { ModulosPage } from '@/features/modulos/modulos-page'
import { UsuariosAdminListPage } from '@/features/usuarios-admin/usuarios-admin-list-page'
import { TicketsListPage } from '@/features/soporte/tickets-list-page'
import { TicketDetailPage } from '@/features/soporte/ticket-detail-page'
import { TicketsReportPage } from '@/features/soporte/tickets-report-page'
import { ComunicacionesPage } from '@/features/comunicaciones/comunicaciones-page'
import { MonitoreoPage } from '@/features/monitoreo/monitoreo-page'
import { AuditoriaPage } from '@/features/auditoria/auditoria-page'
import { ConfiguracionPage } from '@/features/configuracion/configuracion-page'
import { MiPerfilPage } from '@/features/perfil/mi-perfil-page'

export function AdminRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/2fa" element={<Login2FAPage />} />
        </Route>

        {/* Protected admin routes */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Módulo 1: Dashboard global (todos los roles) */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Perfil del admin autenticado (todos los roles) */}
          <Route path="/perfil" element={<MiPerfilPage />} />

          {/* Módulo 2: Gestión de empresas (SA, AC write | ST, AU read) */}
          <Route
            path="/empresas"
            element={
              <AdminRoleGuard roles={['SA', 'AC', 'ST', 'AU']}>
                <EmpresasListPage />
              </AdminRoleGuard>
            }
          />
          <Route
            path="/empresas/nueva"
            element={
              <AdminRoleGuard roles={['SA', 'AC']}>
                <EmpresaCreatePage />
              </AdminRoleGuard>
            }
          />
          <Route
            path="/empresas/:id"
            element={
              <AdminRoleGuard roles={['SA', 'AC', 'ST', 'AU']}>
                <EmpresaDetailPage />
              </AdminRoleGuard>
            }
          />

          {/* Módulo 3: Planes y precios (SA, AC write | AF, AU read) */}
          <Route
            path="/planes"
            element={
              <AdminRoleGuard roles={['SA', 'AC', 'AF', 'AU']}>
                <PlanesListPage />
              </AdminRoleGuard>
            }
          />
          <Route
            path="/planes/nuevo"
            element={
              <AdminRoleGuard roles={['SA', 'AC']}>
                <PlanCreatePage />
              </AdminRoleGuard>
            }
          />

          {/* Módulo 4: Licencias (SA, AC, AF write | AU read) */}
          <Route
            path="/licencias"
            element={
              <AdminRoleGuard roles={['SA', 'AC', 'AF', 'AU']}>
                <LicenciasListPage />
              </AdminRoleGuard>
            }
          />

          {/* Módulo 5: Facturación y cobros (SA, AF write | AU read) */}
          <Route
            path="/facturacion"
            element={
              <AdminRoleGuard roles={['SA', 'AF', 'AU']}>
                <FacturacionPage />
              </AdminRoleGuard>
            }
          />

          {/* Módulo 6: Módulos y features (SA, AC, ST) */}
          <Route
            path="/modulos"
            element={
              <AdminRoleGuard roles={['SA', 'AC', 'ST', 'AU']}>
                <ModulosPage />
              </AdminRoleGuard>
            }
          />

          {/* Módulo 7: Usuarios admin (solo SA) */}
          <Route
            path="/usuarios-admin"
            element={
              <AdminRoleGuard roles={['SA', 'AU']}>
                <UsuariosAdminListPage />
              </AdminRoleGuard>
            }
          />

          {/* Módulo 8: Soporte y tickets (SA, ST write | AC, AU read) */}
          <Route
            path="/soporte"
            element={
              <AdminRoleGuard roles={['SA', 'ST', 'AC', 'AU']}>
                <TicketsListPage />
              </AdminRoleGuard>
            }
          />
          <Route
            path="/soporte/tickets/:id"
            element={
              <AdminRoleGuard roles={['SA', 'ST', 'AC', 'AU']}>
                <TicketDetailPage />
              </AdminRoleGuard>
            }
          />
          <Route
            path="/soporte/reportes"
            element={
              <AdminRoleGuard roles={['SA', 'ST', 'AC', 'AU']}>
                <TicketsReportPage />
              </AdminRoleGuard>
            }
          />

          {/* Módulo 9: Comunicaciones (SA, AC write | AU read) */}
          <Route
            path="/comunicaciones"
            element={
              <AdminRoleGuard roles={['SA', 'AC', 'AU']}>
                <ComunicacionesPage />
              </AdminRoleGuard>
            }
          />

          {/* Módulo 10: Monitoreo (SA, ST write | AU read) */}
          <Route
            path="/monitoreo"
            element={
              <AdminRoleGuard roles={['SA', 'ST', 'AU']}>
                <MonitoreoPage />
              </AdminRoleGuard>
            }
          />

          {/* Módulo 11: Auditoría (SA, AU) */}
          <Route
            path="/auditoria"
            element={
              <AdminRoleGuard roles={['SA', 'AU']}>
                <AuditoriaPage />
              </AdminRoleGuard>
            }
          />

          {/* Módulo 12: Configuración global (solo SA) */}
          <Route
            path="/configuracion"
            element={
              <AdminRoleGuard roles={['SA', 'AU']}>
                <ConfiguracionPage />
              </AdminRoleGuard>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
