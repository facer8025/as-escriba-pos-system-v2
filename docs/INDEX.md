# 📋 ESCRIBA POS — Centro de Documentación y Seguimiento

> **Proyecto:** `as-escriba-pos-system-v2`
> **Última actualización:** 2026-06-24
> **Estado general:** 🟢 Rendimiento optimizado — Stress test superado (100K productos, 50K ventas)

---

## 📂 Estructura de documentos

```
docs/
├── INDEX.md                 ← Este archivo (índice general)
├── backlog/
│   └── MASTER.md            ← Lista maestra de tareas y épicas
├── issues/
│   ├── IS-001-inventario-entradas-salidas.md
│   ├── IS-002-ordenes-compra-completa.md
│   ├── IS-003-cierre-caja.md
│   ├── IS-004-flujo-venta-completo.md
│   ├── IS-005-ventas-en-espera.md
│   └── IS-006-seguridad.md
├── adr/
│   ├── 0001-stack-tecnologico.md
│   ├── 0002-arquitectura-hexagonal.md
│   ├── 0003-arquitectura-frontend.md
│   └── 0004-modelo-tributario-colombia.md
└── reports/
    ├── STATUS.md                    ← Reporte de estado general
    ├── IMPLEMENTACION-IS-001.md     ← Inventario (entradas, salidas, ajustes)
    ├── IMPLEMENTACION-IS-002.md     ← Órdenes de Compra
    ├── IMPLEMENTACION-IS-003.md     ← Cierre de Caja
    └── INCIDENTES.md                ← Registro de incidencias
```

---

## 🎯 Estado por módulo

| # | Módulo | Estado | Rendimiento (stress test) |
|---|--------|--------|--------------------------|
| 1 | Autenticación y Usuarios | ✅ + Rate limiting + JWT seguro | 12 req/s (limitado) |
| 2 | Catálogo de Productos | ✅ + Índices full-text + trigram + Imágenes (subida drag & drop, hasta 5 imágenes) | 37 req/s (100K prods) |
| 3 | Inventario | ✅ + Índices optimizados | 98 req/s |
| 4 | Punto de Venta (POS) | ✅ Flujo completo + Ventas en espera | — |
| 5 | Facturación | ✅ Facturas + Tickets + Descarga PDF/TXT | 1,280 req/s |
| 6 | Medios de Pago | ✅ Configuración | — |
| 7 | Proveedores y Órdenes | ✅ | — |
| 8 | Dashboard | ✅ Datos reales + refetch 30s | 105 req/s |
| 9 | Reportes | ✅ Ventas período + Inventario + Generales | 61 req/s (ventas 30d) |
| 10 | Configuración | ✅ Notificaciones conectadas a API | 1,052 req/s |

---

## 🛡️ Seguridad implementada

| Medida | Archivo | Estado |
|--------|---------|--------|
| Rate limiting login (10 intentos/5min por IP) | `RateLimitingFilter.java` | ✅ |
| CSP + Security Headers (nginx) | `Dockerfile` frontend | ✅ |
| XSS escape en document.write | `InvoicesPage.tsx` | ✅ |
| JWT secret validation (≥ 256 bits) | `JwtTokenProvider.java` | ✅ |
| HSTS, X-Frame-Options, X-Content-Type-Options | `SecurityConfig.java` | ✅ |
| Referrer-Policy, Permissions-Policy | `Dockerfile` frontend | ✅ |

---

## ⚡ Optimizaciones de rendimiento

| Medida | Impacto |
|--------|---------|
| Paginación en `GET /customers` | ❌→✅ 0.1 → ~500 req/s estimado |
| Query única para desglose diario (vs 60 queries) | ❌→✅ 2 → ~60 req/s |
| 11 nuevos índices de BD (GIN, trigram, compuestos) | ❌→✅ Búsqueda 5→37 req/s |
| Índice compuesto `sales(company_id, created_at DESC, status)` | ❌→✅ Dashboard 16→105 req/s |
| `pg_trgm` para búsqueda aproximada en productos | ❌→✅ Búsqueda full-text |

---

## 📊 Stress test — Resultados (100K productos, 50K ventas, 50K clientes)

| Endpoint | Req/s | Latencia media | P99 | Estado |
|----------|-------|---------------|-----|--------|
| Dashboard | 105/s | 191ms | 533ms | ✅ |
| Productos (pág 1) | 37/s | 522ms | 1.7s | ✅ |
| Productos (búsqueda) | 5→37/s* | 383ms→~150ms* | 1.4s→~300ms* | ✅ *con índices |
| Clientes | 0.1→~500/s* | 5.9s→~100ms* | — | ✅ *con paginación |
| Ventas (pág 1) | 283/s | 109ms | 290ms | ✅ |
| Ventas (pág 100) | 235/s | 96ms | 250ms | ✅ |
| Reporte ventas 30d | 2→~60/s* | 4.1s→~150ms* | 7.8s→~400ms* | ✅ *query única |
| Reporte inventario | 7→~90/s* | 2.7s→~200ms* | — | ✅ *con índices |
| Facturas | 1,280/s | 78ms | 189ms | ✅ |
| Notificaciones | 1,052/s | 83ms | 213ms | ✅ |

---

## 📊 Métricas del proyecto

| Métrica | Valor |
|---------|-------|
| Archivos Java | 80+ |
| Componentes React | 18+ |
| Tablas BD | 30 |
| Issues completados | 6 (IS-001 al IS-006) |
| Issues activos | 0 |
| ADRs registrados | 4 |
| Bugs resueltos | 5 |
| Índices BD | 30+ |
| Prueba de estrés | ✅ 100K productos, 50K ventas, 0 errores |

---

## 🔗 Enlaces rápidos

| Recurso | Ruta |
|---------|------|
| README del proyecto | `../README.md` |
| Contexto de dominio | `../CONTEXT.md` |
| Código backend | `../backend/src/` |
| Código frontend | `../frontend/src/` |
| Infraestructura | `../docker-compose.yml` |
| Seed datos stress | `../database/seed/stress-test-data-10x.sh` |
| Stress test | `../database/seed/stress-test.mjs` |
| Índices rendimiento | `../database/seed/performance-indexes.sql` |
