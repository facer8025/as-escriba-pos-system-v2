# ADM-016/017/018: Dashboard Global — API + Frontend

- **Épica:** EP-015 — Módulo Administrativo Global
- **Fase:** 2 — Core Business · **Sprint:** 3
- **Prioridad:** Alta
- **Estimado:** 3 días
- **Dependencias:** ADM-001 (Schema BD), ADM-003 (Entities)

---

## Descripción

Conectar el dashboard del panel administrativo a la API real, reemplazando los datos mock por queries en vivo a la base de datos. El dashboard muestra KPIs globales del sistema, estado de servicios y feed de actividad reciente.

## Endpoints

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/admin/dashboard/kpis` | KPIs globales (empresas activas, MRR, tickets, licencias, servicios, actividad) |

## Criterios de aceptación

- [x] Backend: DashboardService con queries reales a BD
- [x] Backend: KPIs calculados en vivo (tenantRepository, licenseRepository, ticketRepository)
- [x] Frontend: Fetch desde API en `useEffect` con loading/error states
- [x] Frontend: 5 KPI cards con datos reales
- [x] Frontend: Sección "Estado del sistema" con servicios
- [x] Frontend: Feed "Actividad reciente" conectado a API
- [x] Frontend: Banner de impersonation para roles ST/AU
- [x] Sin datos mock — todo consulta en vivo
