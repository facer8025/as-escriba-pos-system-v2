# ADM-038/039/040/041: Tickets de Soporte — API + Frontend

- **Épica:** EP-015 — Módulo Administrativo Global
- **Fase:** 3 — Financiero y Soporte · **Sprint:** 6
- **Prioridad:** Alta
- **Estimado:** 4 días
- **Dependencias:** ADM-001 (Schema BD), ADM-003 (Entities SupportTicket + TicketMessage)

---

## Descripción

Implementar el módulo completo de tickets de soporte técnico, incluyendo API REST con filtros avanzados, bandeja de tickets con stats en vivo, detalle con conversación, y reportes de soporte.

## Endpoints

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/admin/tickets/stats` | Estadísticas del tablero |
| GET | `/admin/tickets` | Lista paginada con filtros |
| GET | `/admin/tickets/{id}` | Detalle del ticket |
| POST | `/admin/tickets` | Crear ticket |
| PUT | `/admin/tickets/{id}` | Actualizar ticket |
| POST | `/admin/tickets/{id}/assign/{adminUserId}` | Asignar a admin |
| GET | `/admin/tickets/{id}/messages` | Mensajes del ticket |
| POST | `/admin/tickets/{id}/messages` | Agregar mensaje |

## Criterios de aceptación

- [x] Backend: TicketService con CRUD, filtros Criteria API, SLA, stats
- [x] Backend: TicketController con 9 endpoints REST
- [x] Backend: DTOs request/response completos
- [x] Backend: Repositorio con queries de stats y SLA
- [x] Frontend: Bandeja con stats cards y filtros combinados
- [x] Frontend: Modal de creación de ticket
- [x] Frontend: Detalle con conversación y compositor de mensajes
- [x] Frontend: Notas internas y re-apertura automática
- [x] Frontend: Panel de gestión con cambio de estado y asignación
- [x] Frontend: Reportes con KPIs, gráficas y cumplimiento SLA
- [x] Frontend: Ruta `/soporte/reportes` en router y sidebar

## Archivos creados

### Backend (8 archivos)
- `admin/service/TicketService.java`
- `admin/controller/TicketController.java`
- `admin/model/dto/request/CreateTicketRequest.java`
- `admin/model/dto/request/UpdateTicketRequest.java`
- `admin/model/dto/request/AddTicketMessageRequest.java`
- `admin/model/dto/response/TicketResponse.java`
- `admin/model/dto/response/TicketMessageResponse.java`
- `admin/model/dto/response/TicketStatsResponse.java`

### Backend (1 archivo modificado)
- `admin/repository/SupportTicketRepository.java`

### Frontend (3 archivos)
- `frontend-admin/src/features/soporte/tickets-list-page.tsx` (reescrito)
- `frontend-admin/src/features/soporte/ticket-detail-page.tsx` (reescrito)
- `frontend-admin/src/features/soporte/tickets-report-page.tsx` (nuevo)
- `frontend-admin/src/routes/admin-router.tsx` (modificado)
- `frontend-admin/src/components/layout/admin-sidebar.tsx` (modificado)
