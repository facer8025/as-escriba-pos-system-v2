# ESCRIBA POS System v2 🏪

> **Nombre clave:** `as-escriba-pos-system-v2`
> **Stack:** React 19 + Vite 6 + Spring Boot 3.4 + PostgreSQL 16

Sistema de Punto de Venta e Inventario multi-empresa, multi-sucursal, con facturación electrónica DIAN para el mercado colombiano.

## Arquitectura

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
cd frontend && npm run dev   # http://localhost:5173
cd backend && mvn spring-boot:run  # http://localhost:8080
```

## Módulos (10 MVP)

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
└── frontend/                 # React + Vite
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── layouts/          # MainLayout, POSLayout, Sidebar, Header
        ├── pages/            # Login, Dashboard, POS, Products, Users...
        ├── components/       # UI Components
        ├── stores/           # Zustand (auth, UI)
        ├── services/         # Axios API client
        ├── types/            # TypeScript interfaces
        └── lib/              # Utils (formatting, cn)
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

| Código | Rol | Acceso |
|--------|-----|--------|
| SA | Superadmin | Acceso total al sistema |
| AD | Administrador | Gestión completa de la empresa |
| CA | Cajero | Operación del POS y caja |
| BO | Bodeguero | Gestión de inventario y bodegas |
| VE | Vendedor | Ventas y atención al cliente |
