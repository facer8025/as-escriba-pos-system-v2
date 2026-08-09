# 📋 Reporte de Implementación — ADM-001: Schema Admin

> **Tarea:** Schema de base de datos del panel administrativo
> **Fase:** 1 — Fundación · **Sprint:** 1
> **Fecha:** 2026-07-06
> **Responsable:** Orquestador
> **Estado:** ✅ Completado

---

## 1. Resumen

Se implementó el DDL completo del schema `public` para el módulo administrativo global de ESCRIBA POS. El schema almacena exclusivamente datos de gestión interna del SaaS (usuarios admin, empresas clientes, planes, licencias, facturación, tickets, auditoría, etc.) y está completamente separado del schema de negocio de los tenants.

Se creó la migración Flyway V5 con 25 tablas, 2 funciones PL/pgSQL, 1 vista materializada y seed data inicial. El DDL es idempotente (CREATE IF NOT EXISTS, ON CONFLICT DO NOTHING, CREATE OR REPLACE) para coexistir con el script `02-admin-schema.sql` que se ejecuta en la inicialización del contenedor PostgreSQL.

## 2. Archivos creados/modificados

### Backend (2 archivos)

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `backend/src/main/resources/db/migration/V5__admin_schema.sql` | ✅ Creado | Migración Flyway con 25 tablas admin, funciones, vista y seed data (29KB) |
| `backend/src/main/resources/application.yml` | ✅ Modificado | `baseline-version: 4`, `out-of-order: true` para permitir migración V5 |

### Documentación (3 archivos)

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `docs/issues/ADM-001-admin-schema.md` | ✅ Creado | Especificación detallada de la tarea |
| `docs/reports/IMPLEMENTACION-ADM-001.md` | ✅ Creado | Este reporte de implementación |
| `docs/backlog/MASTER.md` | ⏳ Pendiente | Marcar ADM-001 como completado |

## 3. Detalle de implementación

### 3.1 Estructura del DDL

```
V5__admin_schema.sql (29KB, 4 secciones)
├── 25 tablas con CREATE TABLE IF NOT EXISTS
│   ├── admin_roles, admin_users, admin_refresh_tokens
│   ├── tenants, modules, plans, plan_modules
│   ├── licenses, license_history, tenant_modules
│   ├── feature_flags, tenant_feature_flags
│   ├── tenant_invoices, support_tickets, ticket_messages
│   ├── announcements, announcement_deliveries, maintenance_windows
│   ├── service_health_logs, admin_audit_logs, security_alerts
│   ├── system_config, dian_providers, payment_gateways
├── 30+ índices con CREATE INDEX IF NOT EXISTS
├── 2 funciones PL/pgSQL (create_tenant_schema, log_admin_action)
├── 1 vista (v_admin_dashboard_kpis)
└── Seed data (roles, módulos, config, gateways, superadmin)
```

### 3.2 Idempotencia

Todas las sentencias DDL usan `IF NOT EXISTS` para evitar errores si el schema ya fue creado por el script de inicialización de PostgreSQL (`database/init/02-admin-schema.sql`). Los INSERTs de seed usan `ON CONFLICT DO NOTHING`. Las funciones y vistas usan `CREATE OR REPLACE`.

### 3.3 Credenciales del superadmin por defecto

| Campo | Valor |
|-------|-------|
| Email | `superadmin@escriba.co` |
| Contraseña | `AdminEscriba2025!` |
| Rol | SA (Super Admin) |
| Hash | `$2a$10$lOHOtMOt5NXFTW2ybeVhT.t6Hz.pSBWfoDj8izDFSClLVzpv1E60m` (bcrypt 10 rounds) |

## 4. Configuración de Flyway

Se corrigió la configuración de Flyway en `application.yml`:

| Parámetro | Valor anterior | Nuevo valor | Motivo |
|-----------|---------------|-------------|--------|
| `baseline-version` | 5 | 4 | V5 ahora es la migración admin; V4 era la última migración previa |
| `out-of-order` | (no existía) | `true` | Permite aplicar V5 aunque V2-V4 ya estén en historial |

## 5. Verificación

```
✅ 25 tablas creadas en schema public
✅ 5 roles admin insertados (SA, AC, AF, ST, AU)
✅ 19 módulos funcionales insertados
✅ 15 parámetros de sistema insertados
✅ 4 pasarelas de pago insertadas
✅ Super admin creado (superadmin@escriba.co)
✅ Vista v_admin_dashboard_kpis funcional (7 KPIs)
✅ Función create_tenant_schema() creada
✅ Función log_admin_action() creada
✅ API admin retorna 401 sin autenticación
✅ Flyway V5 checksum: 1333683205
```

## 6. Lecciones aprendidas

1. **Conflicto de versiones Flyway**: La base de datos tenía un V5 previo (checksum 0) que no correspondía a ningún archivo de migración. Se eliminó el registro fantasma y se reposicionó la migración.
2. **Idempotencia necesaria**: El DDL también se ejecuta via `docker-entrypoint-initdb.d`. Usar `IF NOT EXISTS` evita conflictos cuando Flyway corre después.
3. **Checksum 0**: Un checksum de 0 en `flyway_schema_history` indica que la migración se aplicó sin control de integridad. La nueva V5 tiene checksum real (1333683205).
