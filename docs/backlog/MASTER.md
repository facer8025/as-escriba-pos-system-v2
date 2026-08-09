# 📋 Backlog Maestro — ESCRIBA POS v2

> **Total épicas:** 15 | **Completadas:** 11 | **En progreso:** 1 | **Pendientes:** 3

---

## ✅ Épicas completadas (FASE 1-2)

### EP-001: Infraestructura base
- [x] Docker Compose (PostgreSQL + Redis + Backend + Frontend + Adminer)
- [x] Dockerfile multistage para backend y frontend
- [x] .dockerignore, .env.example
- [x] Red y volúmenes persistentes
- **Entregable:** `docker-compose.yml`, `Dockerfile`s

### EP-002: Base de datos PostgreSQL
- [x] Schema completo (30 tablas)
- [x] Índices, vistas, funciones PL/pgSQL, triggers
- [x] Seed data: roles, unidades, tipos ID, medios de pago
- [x] Migración V2 con datos demo (empresa, admin, productos)
- **Entregable:** `database/init/01-schema.sql`, `V2__seed_demo_data.sql`

### EP-003: Backend Spring Boot (core)
- [x] Configuración Maven con Spring Boot 3.4 + Java 21
- [x] 18 entidades JPA con relaciones
- [x] 10 repositorios Spring Data
- [x] Seguridad JWT (access + refresh tokens)
- [x] Manejo global de excepciones
- [x] OpenAPI / Swagger
- **Entregable:** Backend funcional con API REST en `localhost:8082`

### EP-004: Módulo 1 — Autenticación y Usuarios
- [x] Login con JWT (usuario/email + contraseña)
- [x] Bloqueo por intentos fallidos
- [x] Refresh token
- [x] CRUD de usuarios con roles
- [x] Cambio de contraseña
- [x] LoginPage con UI empresarial
- [x] UsersPage con tabla, roles, toggle estado
- [x] UsersPage: CRUD completo (modal crear/editar · toggle activo · eliminar · filtros) (IS-008)
- **Entregable:** AuthController, UserController, LoginPage, UsersPage

### EP-005: Módulo 2 — Catálogo de Productos
- [x] CRUD de productos con JPA
- [x] Búsqueda y filtros (categoría, estado, texto)
- [x] Semáforo de stock (verde/amarillo/rojo)
- [x] Vista tabla y vista tarjetas
- [x] Paginación
- [x] Exportar: menú dropdown PDF / Excel / CSV (IS-007)
- **Entregable:** ProductController, ProductService, ProductsCatalogPage

### EP-006: Módulo 4 — Punto de Venta (POS)
- [x] Layout 3 columnas (búsqueda / carrito / pago)
- [x] Búsqueda en tiempo real de productos
- [x] Carrito con cantidad, precio, descuento
- [x] Modal de pago con 6 medios
- [x] Atajos de teclado (F1, F9, F12)
- [x] POSLayout fullscreen (sin sidebar)
- **Entregable:** POSPage, POSLayout, SaleController

### EP-007: Módulo 6-7-8 (Proveedores, Dashboard)
- [x] Dashboard con widgets y gráficos (Recharts)
- [x] API de resumen (ventas del día, tendencias)
- [x] CRUD de proveedores
- [x] Órdenes de compra
- [x] Movimientos de inventario / kardex
- **Entregable:** DashboardController, SupplierController, InventoryController, DashboardPage

### EP-008: Módulo 10 — Configuración
- [x] Sidebar con navegación completa
- [x] Rutas para todos los módulos
- [x] Placeholders para páginas pendientes
- **Entregable:** App.tsx con routing completo, MainLayout, Sidebar

### EP-015: Módulo Administrativo Global — Fundación ✅
- [x] ADM-001: Schema de BD admin (25 tablas + seed data) ✅
- [x] ADM-004: Migración Flyway V5 (incluido en ADM-001)
- [x] ADM-006: Seed data inicial (roles, módulos, config)
- [x] ADM-002: Módulo Spring Boot admin/ ✅
- [x] ADM-003: JPA entities schema public (11 entities) ✅
- [x] ADM-005: Repositorios JPA admin (11 repos) ✅
- [x] ADM-007: Auth admin (login + TOTP + JWT) ✅
- [x] ADM-008: JWT RS256 separado ✅
- [x] ADM-009: Rate limiting + bloqueo ✅
- [x] ADM-010~015: Frontend-admin completo (scaffolding, UI, layout, login, guards, stores) ✅
- **Documentación:** `docs/admin/ARQUITECTURA-MODULO-ADMIN.md`, `docs/admin/ROADMAP.md`
- **Entregable:** Fase 1 completa (Sprint 1 + Sprint 2)

---

## 🔧 Pendientes (Fase 2-4)

### EP-009: Frontend placeholders → implementación completa
- [x] Inventario: Resumen con tarjetas y tabla ✅
- [x] Inventario: Entradas con buscador y tabla dinámica ✅
- [x] Inventario: Salidas con validación de stock ✅
- [x] Inventario: Ajuste rápido (entrada/salida/valor directo) ✅
- [ ] Inventario: Traslados
- [x] Órdenes de compra: Lista con filtros y paginación ✅
- [x] Órdenes de compra: Creación con búsqueda de proveedor y productos ✅
- [x] Órdenes de compra: Recepción de mercancía con control de novedades ✅
- [ ] Facturación: Facturas emitidas, detalle
- [x] Reportes: Ventas por período (con exportación PDF/Excel/CSV ✅ IS-007)
- [x] Reporte Inventario (con exportación PDF/Excel/CSV ✅ IS-007)
- [ ] Configuración: Empresa, Sucursales, Parámetros, Catálogos
- **Estimado:** 8 issues verticales
- **Prioridad:** Alta
- **Avance:** 50%

### EP-010: Facturación Electrónica DIAN (Módulo 5)
- [ ] Integración con proveedor tecnológico (Factus/Alanube)
- [ ] Resoluciones de numeración
- [ ] Envío de facturas electrónicas
- [ ] Notas crédito
- [ ] CUFE y QR
- **Estimado:** 4 issues verticales
- **Prioridad:** Media
- **Dependencia:** EP-012 (flujo de venta completo)

---

### EP-011bis: Módulo de Clientes
- [ ] API CRUD de clientes (backend)
- [ ] Página de listado de clientes
- [ ] Búsqueda de clientes desde el POS
- [ ] Modal de creación rápida de cliente
- [ ] Asociar cliente a venta y factura
- **Estimado:** 2 issues verticales
- **Prioridad:** Alta
- **Dependencia:** Ninguna (independiente)

### EP-012: Flujo de Venta Completo (IS-004)
- [ ] Persistencia de ventas (POST /api/v1/sales)
- [ ] Selección de tipo de documento en pago
- [ ] Validación de stock pre-venta
- [ ] Descuento de inventario post-venta
- [ ] Generación de documento fiscal
- [ ] Conexión frontend → backend (confirmar pago)
- **Estimado:** 3 issues verticales
- **Prioridad:** 🔴 Crítica
- **Dependencia:** EP-011bis (clientes para FE)

## ⏳ Pendientes

### EP-013: Exportación PDF y Excel
- [x] Inventario Resumen: menú dropdown PDF / Excel / CSV (IS-007)
- [x] Catálogo de Productos: menú dropdown PDF / Excel / CSV (IS-007)
- [x] Reporte Ventas por período: menú dropdown PDF / Excel / CSV (IS-007)
- [x] Reporte Inventario: menú dropdown PDF / Excel / CSV (IS-007)
- [x] Configuración > Catálogos: menú dropdown PDF / Excel / CSV (IS-007)
- [x] Refactor: exportUtils genérico para todos los módulos
- **Prioridad:** Media

### EP-014: Pruebas automatizadas
- [x] Tests unitarios (JUnit 5 + Mockito) — 63 tests: SaleService (10), AuthService (14), InventoryService (10), CashSessionService (8), PlanService (8), LicenseService (7), InvoiceService (6) ✅
- [x] Tests de integración (Testcontainers) — `EscribaPosApplicationIT` (PostgreSQL + Redis, requiere Docker con soporte bridge; se ejecuta con `mvn verify`) ✅
- [x] Tests de frontend (Vitest) — frontend-admin: 50 tests · frontend cliente: 21 tests ✅
- **Prioridad:** Media
- **Avance:** 3/3 (134 tests: 63 backend + 50 admin + 21 cliente, todos pasando)

---

## 📐 Convenciones

| Prefijo | Significado |
|---------|-------------|
| EP | Épica (conjunto de issues) |
| IS | Issue individual (vertical slice) |
| ADR | Decision Record |
| BUG | Incidencia / bug |
