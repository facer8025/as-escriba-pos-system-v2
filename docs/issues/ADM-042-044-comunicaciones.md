# ADM-042/043/044: Comunicaciones — API + Frontend

- **Épica:** EP-015 — Módulo Administrativo Global
- **Fase:** 3 — Financiero y Soporte · **Sprint:** 6
- **Prioridad:** Alta
- **Estimado:** 3 días
- **Dependencias:** ADM-001 (Schema BD), ADM-003 (Entities Announcement + AnnouncementDelivery)

---

## Descripción

Implementar el módulo de comunicaciones para enviar anuncios masivos a empresas clientes, incluyendo redactor HTML, programación, segmentación, plantillas reutilizables y métricas de entrega.

## Endpoints

| Método | Ruta | Propósito |
|--------|------|-----------|
| GET | `/admin/announcements` | Lista paginada con filtro |
| GET | `/admin/announcements/{id}` | Detalle del comunicado |
| POST | `/admin/announcements` | Crear comunicado |
| PUT | `/admin/announcements/{id}` | Actualizar comunicado |
| POST | `/admin/announcements/{id}/send` | Enviar comunicado |

## Criterios de aceptación

- [x] Backend: AnnouncementService con CRUD, envío masivo, segmentación
- [x] Backend: AnnouncementController con 5 endpoints REST
- [x] Backend: DTOs request/response completos
- [x] Backend: Repositorios con queries de filtros y métricas
- [x] Frontend: Redactor con editor HTML, tipo, canales, programación
- [x] Frontend: Vista previa en vivo del HTML
- [x] Frontend: Historial con filtros y stats cards
- [x] Frontend: Acción de envío masivo con confirmación
- [x] Frontend: Gestor de plantillas (CRUD + aplicar)
- [x] Frontend: Persistencia de plantillas en localStorage

## Archivos creados

### Backend (5 archivos)
- `admin/service/AnnouncementService.java`
- `admin/controller/AnnouncementController.java`
- `admin/model/dto/request/CreateAnnouncementRequest.java`
- `admin/model/dto/request/UpdateAnnouncementRequest.java`
- `admin/model/dto/response/AnnouncementResponse.java`

### Backend (2 archivos modificados)
- `admin/repository/AnnouncementRepository.java`
- `admin/repository/TenantRepository.java`

### Frontend (1 archivo)
- `frontend-admin/src/features/comunicaciones/comunicaciones-page.tsx` (reescrito completo)
