# PRD: ESCRIBA POS — Módulo de Clientes y Notificaciones

## Problem Statement
Los administradores necesitan gestionar los datos de los clientes para facturación electrónica (NIT, CC, razón social) y configurar qué notificaciones reciben y por qué canal.

## Solution
Módulo de clientes con CRUD completo y búsqueda, más un módulo de notificaciones con configuración de canales (email, in-app, push) y centro de notificaciones in-app en el header.

## User Stories
1. Como administrador, quiero crear, editar y desactivar clientes, para mantener el directorio actualizado
2. Como cajero, quiero buscar clientes por nombre o documento desde el POS, para asociarlos a la venta
3. Como administrador, quiero configurar qué notificaciones recibo y por qué canal, para no ser saturado
4. Como usuario, quiero ver notificaciones in-app con un badge de no leídas, para estar informado

## Implementation Decisions
- Clientes: CRUD completo con tabla paginada, modales de crear/editar/detalle, toggle de estado
- Búsqueda de clientes desde POS con autocompletado
- Notificaciones: tabla `notification_config` en BD con trigger de defaults por empresa
- Panel de notificaciones en header: badge con contador, dropdown con lista, marcar leídas
- Toggles con actualización optimista (UI inmediata, rollback en error)
- `refetchInterval: 30000` para mantener datos frescos

## API Contracts
- `GET /api/v1/customers?companyId=X&page=&size=`
- `POST /api/v1/customers`
- `PUT /api/v1/customers/{id}`
- `GET /api/v1/notifications/config?companyId=X`
- `PUT /api/v1/notifications/config`
- `GET /api/v1/notifications?companyId=X&userId=Y`
- `GET /api/v1/notifications/unread-count?companyId=X&userId=Y`
- `POST /api/v1/notifications/{id}/read`
- `POST /api/v1/notifications/read-all?companyId=X&userId=Y`

## Out of Scope
- Push notifications reales (solo configuración de canal)
- Notificaciones por email reales (solo registro de preferencias)
- Importación masiva de clientes desde Excel
