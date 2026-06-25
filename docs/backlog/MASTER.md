# 📋 Backlog Maestro — ESCRIBA POS v2

> **Total épicas:** 14 | **Completadas:** 8 | **En progreso:** 3 | **Pendientes:** 3

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
- **Entregable:** AuthController, UserController, LoginPage, UsersPage

### EP-005: Módulo 2 — Catálogo de Productos
- [x] CRUD de productos con JPA
- [x] Búsqueda y filtros (categoría, estado, texto)
- [x] Semáforo de stock (verde/amarillo/rojo)
- [x] Vista tabla y vista tarjetas
- [x] Paginación
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

---

## 🔧 En progreso

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
- [ ] Reportes: Ventas, Cierre de caja, Inventario, Compras
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
- [ ] Reportes en PDF (cierre de caja, facturas)
- [ ] Exportación Excel (productos, ventas, inventario)
- **Prioridad:** Baja

### EP-014: Pruebas automatizadas
- [ ] Tests unitarios (JUnit 5 + Mockito)
- [ ] Tests de integración (Testcontainers)
- [ ] Tests de frontend (Vitest)
- **Prioridad:** Media

---

## 📐 Convenciones

| Prefijo | Significado |
|---------|-------------|
| EP | Épica (conjunto de issues) |
| IS | Issue individual (vertical slice) |
| ADR | Decision Record |
| BUG | Incidencia / bug |
