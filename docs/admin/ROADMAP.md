# ESCRIBA — Módulo Administrativo Global
## Plan de Implementación Detallado v1.0

> **Inicio estimado:** Sprint actual
> **Duración total:** ~60 días hábiles (3 meses)
> **Dependencia externa:** Especificación funcional aprobada

---

## Convenciones

| Símbolo | Significado |
|---------|-------------|
| ✅ | Completado |
| 🚧 | En progreso |
| ⏳ | Pendiente |
| 🔴 | Bloqueado |

---

## Fase 1 — Fundación (Semanas 1-2)

### Sprint 1: Base de datos y API core

| ID | Tarea | Estado | Responsable | Estimación |
|----|-------|--------|-------------|------------|
| ADM-001 | Crear schema de BD admin (`02-admin-schema.sql`) | ✅ | Backend | 2 días |
| ADM-002 | Configurar módulo Spring Boot `admin/` | ✅ | Backend | (ya implementado) |
| ADM-003 | Configurar JPA entities para schema `public` | ✅ | Backend | 2 días (11 entities) |
| ADM-004 | Configurar Flyway migration para admin | ✅ | Backend | (incluido en ADM-001) |
| ADM-005 | Implementar repositorios JPA admin | ✅ | Backend | 1 día (11 repos) |
| ADM-006 | Seed data inicial (admin roles, módulos) | ✅ | Backend | (incluido en ADM-001) |

**Total Sprint 1: 8 días**

### Sprint 2: Autenticación y frontend base

| ID | Tarea | Estado | Responsable | Estimación |
|----|-------|--------|-------------|------------|
| ADM-007 | Implementar auth admin (login + TOTP) | ✅ | Backend | (ya implementado) |
| ADM-008 | JWT con RS256 (par de llaves separado) | ✅ | Backend | (ya implementado) |
| ADM-009 | Rate limiting + bloqueo por intentos | ✅ | Backend | (extendido a /admin/auth/login) |
| ADM-010 | Scaffolding frontend-admin (Vite + React) | ✅ | Frontend | (ya implementado) |
| ADM-011 | UI componentes base (shadcn/ui) | ✅ | Frontend | (ya implementado) |
| ADM-012 | Layout admin (sidebar + header + routing) | ✅ | Frontend | (ya implementado) |
| ADM-013 | Login page + 2FA verification | ✅ | Frontend | (ya implementado) |
| ADM-014 | Protected routes + role guards | ✅ | Frontend | (ya implementado) |
| ADM-015 | Admin stores (auth, ui, admin users) | ✅ | Frontend | (ya implementado) |

**Total Sprint 2: 11 días (pre-implementado, verificado)**

---

## Fase 2 — Core Business (Semanas 3-5)

### Sprint 3: Dashboard y Empresas

| ID | Tarea | Estado | Responsable | Estimación |
|----|-------|--------|-------------|------------|
| ADM-016 | Dashboard API (KPIs + gráficas) | ✅ | Backend | (ya implementado) |
| ADM-017 | Dashboard frontend (8 KPI cards + 4 gráficas) | ✅ | Frontend | (conectado a API real) |
| ADM-018 | Dashboard: estado del sistema + feed actividad | ✅ | Frontend | (conectado a API real) |
| ADM-019 | Empresas API (CRUD + filtros + paginación) | ✅ | Backend | (reparado bug Hibernate + optimizado) |
| ADM-020 | Empresas frontend: lista con filtros | ✅ | Frontend | (conectado a API real) |
| ADM-021 | Empresas frontend: crear empresa (4 pestañas wizard) | ✅ | Frontend | (conectado a API) |
| ADM-022 | Empresas frontend: ficha de empresa (pestañas) | ✅ | Frontend | (conectado a API + impersonation) |
| ADM-023 | Modal impersonation | ✅ | Frontend | (incluido en detalle empresa) |

**Total Sprint 3: 16 días**

### Sprint 4: Planes y Licencias

| ID | Tarea | Estado | Responsable | Estimación |
|----|-------|--------|-------------|------------|
| ADM-024 | Planes API (CRUD + catálogo) | ✅ | Backend | (+ PUT update + PATCH archive) |
| ADM-025 | Planes frontend: tabla + crear/editar plan | ✅ | Frontend | (conectado a API + formulario completo) |
| ADM-026 | Planes frontend: preview de tarjeta de plan | ✅ | Frontend | (vista cards con datos reales) |
| ADM-027 | Licencias API (CRUD + historial + upgrade/downgrade) | ✅ | Backend | (LicenseService + Controller creados) |
| ADM-028 | Licencias frontend: lista con filtros | ✅ | Frontend | (conectado a API + filtros por estado) |
| ADM-029 | Licencias frontend: detalle + acciones | ✅ | Frontend | (endpoints listos: renew, change-plan) |
| ADM-030 | Modal crear licencia manual | ✅ | Frontend | (modal completo + POST API) |

**Total Sprint 4: 13 días (implementado + fix CSS utilities)**

---

## Fase 3 — Financiero y Soporte (Semanas 6-8)

### Sprint 5: Facturación y Módulos

| ID | Tarea | Estado | Responsable | Estimación |
|----|-------|--------|-------------|------------|
| ADM-031 | Facturación API (emitir, pagos, cartera vencida) | ✅ | Backend | (InvoiceService + Controller) |
| ADM-032 | Facturación frontend: panel financiero + tabla facturas | ✅ | Frontend | (stats + tabla con datos reales) |
| ADM-033 | Facturación frontend: emitir factura manual + registrar pago | ✅ | Frontend | (2 modales: crear factura + registrar pago) |
| ADM-034 | Cartera vencida + reportes financieros | ✅ | Frontend | (stats: MRR, cartera, cobros, tasa) |
| ADM-035 | Módulos API (asignación por empresa) | ✅ | Backend | (ModuleService + Controller) |
| ADM-036 | Módulos frontend: vista por empresa + edición | ✅ | Frontend | (selector empresa + toggle módulos) |
| ADM-037 | Feature flags API + frontend | ✅ | Backend + Frontend | 3 días |

**Total Sprint 5: 15 días**

### Sprint 6: Tickets y Comunicaciones (completado)

| ID | Tarea | Estado | Responsable | Estimación |
|----|-------|--------|-------------|------------|
| ADM-038 | Tickets API (CRUD + mensajes + SLA) | ✅ | Backend | 3 días |
| ADM-039 | Tickets frontend: bandeja con filtros | ✅ | Frontend | 2 días |
| ADM-040 | Tickets frontend: detalle + conversación + panel gestión | ✅ | Frontend | 3 días |
| ADM-041 | Tickets: reportes de soporte | ✅ | Frontend | 1 día |
| ADM-042 | Comunicaciones API (CRUD + envío) | ✅ | Backend | 2 días |
| ADM-043 | Comunicaciones frontend: redactor + historial | ✅ | Frontend | 2 días |
| ADM-044 | Comunicaciones frontend: plantillas + mantenimiento | ✅ | Frontend | 1 día |

**Total Sprint 6: 14 días**

---

## Fase 4 — Monitoreo y Administración (Semanas 9-10)

### Sprint 7: Monitoreo y Usuarios Admin (completado)

| ID | Tarea | Estado | Responsable | Estimación |
|----|-------|--------|-------------|------------|
| ADM-045 | Usuarios admin API (CRUD + log acciones) | ✅ | Backend | 2 días |
| ADM-046 | Usuarios admin frontend: lista + crear/editar | ✅ | Frontend | 2 días |
| ADM-047 | Monitoreo API (health checks + métricas) | ✅ | Backend | 2 días |
| ADM-048 | Monitoreo frontend: dashboard salud + servicios | ✅ | Frontend | 2 días |
| ADM-049 | Monitoreo frontend: log errores + cola DIAN | ✅ | Frontend | 2 días |

**Total Sprint 7: 10 días**

### Sprint 8: Auditoría y Configuración (completado)

| ID | Tarea | Estado | Responsable | Estimación |
|----|-------|--------|-------------|------------|
| ADM-050 | Auditoría API (logs + alertas + exportación) | ✅ | Backend | 2 días |
| ADM-051 | Auditoría frontend: log global con filtros | ✅ | Frontend | 2 días |
| ADM-052 | Auditoría frontend: alertas de actividad sospechosa | ✅ | Frontend | 1 día |
| ADM-053 | Configuración global API (parámetros + proveedores) | ✅ | Backend | 2 días |
| ADM-054 | Configuración frontend: sistema + DIAN + pasarelas | ✅ | Frontend | 2 días |
| ADM-055 | Configuración frontend: seguridad + SMTP | ✅ | Frontend | 1 día |
| ADM-056 | Integración final + pruebas E2E | ✅ | QA | 3 días |

**Total Sprint 8: 13 días**

---

## Resumen de fases

| Fase | Días hábiles | Sprint | Módulos cubiertos |
|------|-------------|--------|-------------------|
| Fase 1: Fundación | 14 | Sprint 1-2 | Schema BD, Auth, Layout base |
| Fase 2: Core Business | 16 | Sprint 3-4 | Dashboard, Empresas, Planes, Licencias |
| Fase 1: Fundación | 14 | Sprint 1-2 | Schema BD, Auth, Layout base |
| Fase 2: Core Business | 16 | Sprint 3-4 | Dashboard, Empresas, Planes, Licencias |
| Fase 3: Financiero y Soporte | 15 | Sprint 5-6 | Facturación, Módulos, Tickets, Comunicaciones |
| Fase 4: Monitoreo y Admin | 15 | Sprint 7-8 | Usuarios Admin, Monitoreo, Auditoría, Configuración |
| **Total** | **~60** | **8 sprints** | **12 módulos — ✅ COMPLETADO** |

---

## Priorización para inicio inmediato

Para comenzar el desarrollo ahora mismo, el orden recomendado es:

1. **ADM-001**: Schema de BD (fundación de todo)
2. **ADM-007**: Auth backend (base de seguridad)
3. **ADM-011**: Componentes UI base + layout
4. **ADM-013**: Login + 2FA
5. **ADM-016**: Dashboard (primer módulo visible)
6. **ADM-019**: Empresas (core del negocio)

---

## Hitos clave

| Hito | Fecha estimada | Entregable |
|------|---------------|------------|
| **M1** | Fin Sprint 2 | Admin accesible, login + 2FA funcional, layout completo |
| **M2** | Fin Sprint 4 | Dashboard funcional, CRUD empresas + planes + licencias |
| **M3** | Fin Sprint 6 | Facturación, módulos, tickets y comunicaciones operativos |
| **M4** | Fin Sprint 8 | Sistema completo: monitoreo, auditoría, configuración global ✅ |

---

*Plan de implementación — Módulo Administrativo ESCRIBA v1.0*
