# ESCRIBA POS System v2 🏪

> **Nombre clave:** `as-escriba-pos-system-v2`
> **Stack:** React 19 + Vite 6 + Spring Boot 3.4 + PostgreSQL 16

Sistema de Punto de Venta e Inventario multi-empresa, multi-sucursal, con facturación electrónica DIAN para el mercado colombiano.

## 🆕 Panel Administrativo (admin.escriba.co)

El sistema ahora incluye un **Módulo Administrativo Global** completamente independiente del panel de clientes.
Permite al equipo interno de ESCRIBA gestionar todas las empresas clientes, licencias, planes, facturación,
soporte, monitoreo del sistema y auditoría.

| Recurso | URL |
|---------|-----|
| Panel Admin (dev) | `http://localhost:5174` |
| Panel Admin (prod) | `https://admin.escriba.co` |

## Arquitectura general

### Sistema completo (Panel Cliente + Panel Admin)

```
┌────────────────────────────────────────────────────────────────┐
│              PANEL ADMINISTRATIVO (admin.escriba.co)           │
│                  Solo equipo interno ESCRIBA                    │
│  Dashboard · Empresas · Planes · Licencias · Facturación       │
│  Módulos · Usuarios · Soporte · Comunicaciones                 │
│  Monitoreo · Auditoría · Configuración                         │
└──────────────────────────┬─────────────────────────────────────┘
                           │ Gestiona (API interna)
          ┌────────────────▼─────────────────────┐
          │       PostgreSQL (schema: public)    │
          │  tenants · planes · licencias         │
          │  facturas · tickets · audit_logs      │
          └───────────────┬──────────────────────┘
                          │ Crea y administra
         ┌────────────────▼──────────────────────┐
         │       Schemas de tenants               │
         │  tenant_empresa_a · tenant_empresa_b   │
         │  (datos de negocio de cada cliente)    │
         └───────────────────────────────────────┘
                          │
         ┌────────────────▼──────────────────────┐
         │    PANEL CLIENTE (app.escriba.co)      │
         │  POS · Inventario · Facturación DIAN   │
         │  (lo que ve cada empresa cliente)      │
         └───────────────────────────────────────┘
```

### Stack del panel cliente

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React 19)                      │
│  Vite 6 + TypeScript + TailwindCSS + Zustand + React Query  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST (JWT)
┌──────────────────────────▼──────────────────────────────────┐
│                   Backend (Spring Boot 3.4)                  │
│  Java 21 + JPA/Hibernate + Security + Redis + Flyway        │
└──────────────────────────┬──────────────────────────────────┘
                           │ JDBC
┌──────────────────────────▼──────────────────────────────────┐
│                  PostgreSQL 16 + Redis 7                     │
│              Flyway migrations + UUID PKs                    │
└─────────────────────────────────────────────────────────────┘
```

## Inicio rápido

```bash
# 1. Clonar e iniciar
docker compose up -d --build

# 2. Acceder
Frontend:       http://localhost:3000
Backend API:    http://localhost:8082/api/v1
Swagger UI:     http://localhost:8082/api/v1/swagger-ui.html
Adminer (DB):   http://localhost:8083
PostgreSQL:     localhost:5434
Redis:          localhost:6380

# 3. Desarrollo local
cd frontend && npm run dev          # Panel cliente: http://localhost:5173
cd frontend-admin && npm run dev    # Panel admin:   http://localhost:5174
cd backend && mvn spring-boot:run   # API:           http://localhost:8080
```

## Módulos

### Panel Cliente (10 MVP)

| # | Módulo | Estado |
|---|--------|--------|
| 1 | Autenticación y Usuarios | ✅ Backend + Frontend |
| 2 | Catálogo de Productos | ✅ Backend + Frontend |
| 3 | Inventario (Kardex, entradas, salidas, ajustes) | ✅ Backend + Frontend |
| 4 | Punto de Venta (POS) | ✅ Backend + Frontend |
| 5 | Facturación Electrónica DIAN | ✅ Backend + Frontend |
| 6 | Medios de Pago | ✅ Backend + Frontend |
| 7 | Proveedores y Órdenes de Compra | ✅ Backend + Frontend |
| 8 | Dashboard | ✅ Backend + Frontend |
| 9 | Reportes | ✅ Backend + Frontend |
| 10 | Configuración | ✅ Backend + Frontend |
| — | Facturación Electrónica DIAN provider | 🔧 Integración pendiente |
| — | Exportación PDF | 🔧 Pendiente |

## Módulo Administrativo (12 módulos) — 🚧 En desarrollo

| # | Módulo | Estado | Documentación |
|---|--------|--------|---------------|
| 1 | Dashboard global | 🚧 Frontend (mock data) | [Arquitectura](docs/admin/ARQUITECTURA-MODULO-ADMIN.md) |
| 2 | Gestión de empresas | 🚧 Frontend (lista + ficha) | [Spec](../../documentos/Ideas-de-Proyecto/Sistema-POS-v03/ESPECIFICACION-MODULOS/ESCRIBA_Modulo_Administrativo_SuperAdmin.md) |
| 3 | Planes y precios | 🚧 Frontend (catálogo) | [Roadmap](docs/admin/ROADMAP.md) |
| 4 | Licencias | 🚧 Frontend (lista) | — |
| 5 | Facturación y cobros | ⏳ Pendiente | — |
| 6 | Módulos y feature flags | ⏳ Pendiente | — |
| 7 | Usuarios administradores | 🚧 Frontend (lista) | — |
| 8 | Soporte y tickets | 🚧 Frontend (bandeja) | — |
| 9 | Comunicaciones | ⏳ Pendiente | — |
| 10 | Monitoreo del sistema | ⏳ Pendiente | — |
| 11 | Auditoría global | ⏳ Pendiente | — |
| 12 | Configuración global | ⏳ Pendiente | — |

**Roles del panel admin:** SA (Super Admin) · AC (Admin Comercial) · AF (Admin Financiero) · ST (Soporte Técnico) · AU (Auditor)

---

## Estructura del proyecto

```
as-escriba-pos-system-v2/
├── docker-compose.yml        # Infraestructura completa
├── .env.example              # Variables de entorno
├── CONTEXT.md                # Glosario de dominio
├── database/
│   └── init/01-schema.sql    # Schema PostgreSQL completo
├── backend/                  # Spring Boot
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/escriba/pos/
│       ├── config/           # Security, OpenAPI, CORS
│       ├── security/jwt/     # JWT Provider, Filter
│       ├── controller/       # REST Controllers (8)
│       ├── service/          # Business Logic (3 services)
│       ├── repository/       # JPA Repositories (10)
│       ├── model/entity/     # JPA Entities (18)
│       ├── model/enums/      # Enums (8)
│       ├── dto/request/      # Request DTOs (4)
│       ├── dto/response/     # Response DTOs (6)
│       └── exception/        # Global error handler
├── frontend/                 # Panel cliente: React + Vite (app.escriba.co)
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── layouts/          # MainLayout, POSLayout, Sidebar, Header
│       ├── pages/            # Login, Dashboard, POS, Products, Users...
│       ├── components/       # UI Components
│       ├── stores/           # Zustand (auth, UI)
│       ├── services/         # Axios API client
│       ├── types/            # TypeScript interfaces
│       └── lib/              # Utils (formatting, cn)
├── frontend-admin/           # 🆕 Panel admin: React + Vite (admin.escriba.co)
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── auth/             # Login, 2FA, protected routes, role guards
│       ├── components/       # Layout (sidebar admin, header) + UI components
│       ├── features/
│       │   ├── dashboard/    # Módulo 1: Dashboard global
│       │   ├── empresas/     # Módulo 2: Gestión de empresas
│       │   ├── planes/       # Módulo 3: Planes y precios
│       │   ├── licencias/    # Módulo 4: Licencias
│       │   ├── facturacion/  # Módulo 5: Facturación y cobros
│       │   ├── modulos/      # Módulo 6: Feature flags
│       │   ├── usuarios-admin/ # Módulo 7: Usuarios admin
│       │   ├── soporte/      # Módulo 8: Tickets
│       │   ├── comunicaciones/ # Módulo 9: Comunicaciones
│       │   ├── monitoreo/    # Módulo 10: Monitoreo
│       │   ├── auditoria/    # Módulo 11: Auditoría
│       │   └── configuracion/ # Módulo 12: Configuración global
│       ├── stores/           # Admin auth store + UI store
│       ├── types/            # Admin-specific TypeScript types
│       ├── lib/              # API client, utility functions
│       └── routes/           # Admin router with role-based guards
├── database/
│   ├── init/
│   │   ├── 01-schema.sql     # Schema del tenant (panel cliente)
│   │   └── 02-admin-schema.sql # 🆕 Schema admin (schema: public)
│   └── seed/
│       ├── stress-test-data-10x.sh
│       ├── stress-test.mjs
│       └── performance-indexes.sql
├── docs/
│   ├── INDEX.md              # Centro de documentación
│   └── admin/                # 🆕 Documentación del módulo admin
│       ├── ARQUITECTURA-MODULO-ADMIN.md
│       └── ROADMAP.md
```

## Variables de entorno clave

```env
DB_PASSWORD=escriba_secret_2025
JWT_SECRET=<256-bit-key>
SPRING_PROFILES_ACTIVE=dev
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
VITE_API_URL=http://localhost:8082/api/v1
DIAN_SANDBOX=true
```

## Roles del sistema

### Panel Cliente

| Código | Rol | Acceso |
|--------|-----|--------|
| SA | Superadmin | Acceso total al sistema |
| AD | Administrador | Gestión completa de la empresa |
| CA | Cajero | Operación del POS y caja |
| BO | Bodeguero | Gestión de inventario y bodegas |
| VE | Vendedor | Ventas y atención al cliente |

### Panel Administrativo 🆕

| Código | Rol | Acceso |
|--------|-----|--------|
| SA | Super Admin | Acceso completo a todos los módulos. Crea otros Super Admins |
| AC | Admin Comercial | Gestiona empresas, planes, licencias y comunicaciones |
| AF | Admin Financiero | Gestiona facturación, cobros y reportes financieros |
| ST | Soporte Técnico | Acceso a empresas (solo lectura), tickets y monitoreo |
| AU | Auditor | Solo lectura total en todos los módulos |
