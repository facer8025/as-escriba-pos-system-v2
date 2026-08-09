# 📋 Implementaciones Completadas — GAPS-006/007/008

> **Fecha:** 2026-07-07
> **Gaps resueltos:** Toast system, Error log, Maintenance Windows, IVA en Planes

---

## ✅ Gap: Sistema de notificaciones Toast
- `frontend-admin/src/lib/toast.tsx` — Sistema reactivo de toasts sin dependencias externas
- `showToast(message, type)` — success, error, info, warning
- `ToastContainer` — Componente que se monta en App.tsx
- Auto-destrucción tras 4s, animaciones con framer-motion

## ✅ Gap: Log de errores en Monitoreo
- **Backend**: `MonitoringService` obtiene errores de health checks (7 días atrás) desde `service_health_logs`
- **Repository**: `ServiceHealthLogRepository.findRecentErrors()` — busca logs con status ≠ UP
- **Frontend**: Nueva sección "Log de errores recientes" en monitoreo-page, con check verde si no hay errores

## ✅ Gap: Ventanas de Mantenimiento
- **Backend**: 3 endpoints en SystemConfigController
  - `GET /config/maintenance-windows`
  - `POST /config/maintenance-windows`
  - `POST /config/maintenance-windows/{id}/cancel`
- **Repository**: query `findByScheduledAtAfterOrderByScheduledAtAsc` agregada

## ✅ Gap: IVA en Planes
- **Frontend**: campo IVA% + precio con IVA calculado automáticamente
- **Backend**: `taxRate` agregado a DTOs request/response y PlanService
