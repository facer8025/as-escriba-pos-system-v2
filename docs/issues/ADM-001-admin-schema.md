# ADM-001: Schema de Base de Datos del Panel Admin

- **Épica:** Módulo Administrativo Global
- **Fase:** 1 — Fundación · **Sprint:** 1
- **Prioridad:** 🔴 Crítica (dependencia de todos los módulos admin)
- **Estimado:** 2 días
- **Dependencias:** `01-schema.sql` (schema existente), PostgreSQL 16, Flyway

---

## Descripción

Crear el script DDL completo para el schema `public` de PostgreSQL que almacena los datos de gestión global del panel administrativo de ESCRIBA POS. Este schema es independiente del schema de negocio de los tenants.

Incluye 25 tablas, funciones PL/pgSQL, vista de KPIs, seed data y migración Flyway.

## Principios de diseño

| Principio | Regla |
|-----------|-------|
| **Append-only para auditoría** | `admin_audit_logs` sin UPDATE ni DELETE |
| **JSONB para cambios** | Logs almacenan `data_before` y `data_after` como JSONB |
| **UUIDs como PKs** | Consistente con el modelo existente |
| **Timestamps con zona horaria** | `TIMESTAMPTZ` para todos los logs de auditoría |
| **Soft delete NO** | Registros cancelados cambian `status` |

## Tablas incluidas (25)

| # | Tabla | Propósito | Módulo |
|---|-------|-----------|--------|
| 1 | `admin_roles` | Roles del panel admin (SA, AC, AF, ST, AU) | M2 — Auth |
| 2 | `admin_users` | Usuarios admin + 2FA + IP whitelist + bloqueo | M7 — Usuarios Admin |
| 3 | `admin_refresh_tokens` | Refresh tokens del panel admin | M2 — Auth |
| 4 | `tenants` | Empresas clientes del sistema | M2 — Empresas |
| 5 | `modules` | Catálogo de 19 módulos funcionales | M6 — Módulos |
| 6 | `plans` | Planes de suscripción con precios, trial, límites | M3 — Planes |
| 7 | `plan_modules` | Módulos incluidos en cada plan | M3 — Planes |
| 8 | `licenses` | Licencias por empresa (activa/trial/vencida) | M4 — Licencias |
| 9 | `license_history` | Historial de cambios de licencias | M4 — Licencias |
| 10 | `tenant_modules` | Módulos activos por empresa | M6 — Módulos |
| 11 | `feature_flags` | Feature flags globales del sistema | M6 — Feature Flags |
| 12 | `tenant_feature_flags` | Feature flags por empresa | M6 — Feature Flags |
| 13 | `tenant_invoices` | Facturas emitidas a empresas | M5 — Facturación |
| 14 | `support_tickets` | Tickets de soporte con SLA y prioridad | M8 — Tickets |
| 15 | `ticket_messages` | Mensajes dentro de tickets | M8 — Tickets |
| 16 | `announcements` | Comunicados masivos segmentados | M9 — Comunicaciones |
| 17 | `announcement_deliveries` | Entregas de comunicados | M9 — Comunicaciones |
| 18 | `maintenance_windows` | Ventanas de mantenimiento programado | M9 — Comunicaciones |
| 19 | `service_health_logs` | Health checks de servicios | M10 — Monitoreo |
| 20 | `admin_audit_logs` | Log de auditoría global (append-only) | M11 — Auditoría |
| 21 | `security_alerts` | Alertas de seguridad | M11 — Auditoría |
| 22 | `system_config` | Configuración global (15 parámetros) | M12 — Configuración |
| 23 | `dian_providers` | Proveedores DIAN configurados | M12 — Configuración |
| 24 | `payment_gateways` | Pasarelas de pago | M12 — Configuración |
| 25 | `v_admin_dashboard_kpis` | Vista con KPIs del dashboard global | M1 — Dashboard |

## Seed data

| Tabla | Datos |
|-------|-------|
| `admin_roles` | SA, AC, AF, ST, AU (5 roles) |
| `modules` | 19 módulos (POS_BASIC, INVENTORY, DIAN_BILLING, ECOMMERCE, etc.) |
| `system_config` | 15 parámetros (maintenance_mode, trial_duration, JWT durations, etc.) |
| `payment_gateways` | PayU, ePayco, Nequi API, Daviplata API |
| `admin_users` | Super Admin: `superadmin@escriba.co` / `AdminEscriba2025!` |

## Funciones PL/pgSQL

| Función | Propósito |
|---------|-----------|
| `create_tenant_schema(uuid, varchar)` | Crea schema PostgreSQL al registrar una empresa |
| `log_admin_action(...)` | Helper para insertar eventos de auditoría (14 parámetros) |

## Criterios de aceptación

- [x] El DDL se ejecuta sin errores sobre PostgreSQL 16
- [x] 25 tablas creadas en schema `public` (CREATE TABLE IF NOT EXISTS)
- [x] Seed data insertado con ON CONFLICT DO NOTHING para idempotencia
- [x] Funciones PL/pgSQL creadas con CREATE OR REPLACE
- [x] Vista `v_admin_dashboard_kpis` retorna datos (7 KPIs)
- [x] Migración Flyway V5 aplicada exitosamente
- [x] No hay conflictos con schema existente (`01-schema.sql`)
- [x] API admin retorna 401 para peticiones sin autenticar
