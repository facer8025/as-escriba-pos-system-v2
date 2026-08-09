# ADM-005: Repositorios JPA Admin

- **Épica:** EP-015 — Módulo Administrativo Global
- **Fase:** 1 — Fundación · **Sprint:** 1
- **Prioridad:** Alta
- **Estimado:** 1 día
- **Dependencias:** ADM-003 (JPA Entities)

---

## Descripción

Crear los repositorios JPA faltantes para completar la capa de acceso a datos del schema `public`. Cada repositorio extiende `JpaRepository` y proporciona métodos de consulta estándar y personalizados via `@Query`.

## Repositorios creados (11 nuevos + 12 existentes = 23 total)

### Nuevos (11)
| Repositorio | Entidad | Métodos destacados |
|-------------|---------|-------------------|
| `FeatureFlagRepository` | FeatureFlag | findByCode, existsByCode |
| `TenantFeatureFlagRepository` | TenantFeatureFlag | findByTenantId, findByTenantIdAndFlagCode, deleteByTenantIdAndFlagCode |
| `TicketMessageRepository` | TicketMessage | findByTicketIdOrderByCreatedAtAsc, countByTicketId |
| `AnnouncementRepository` | Announcement | findByFilters (JPQL), findByScheduledAtBeforeAndStatus |
| `AnnouncementDeliveryRepository` | AnnouncementDelivery | findByAnnouncementId, findByTenantId, countByAnnouncementIdAndStatus |
| `MaintenanceWindowRepository` | MaintenanceWindow | findByStatus, findByStartsAtBetween, countByStatus |
| `ServiceHealthLogRepository` | ServiceHealthLog | findTop20ByServiceNameOrderByCheckedAtDesc, findAllServiceNames, findLatestStatusByService |
| `SecurityAlertRepository` | SecurityAlert | findByFilters (JPQL), findRecentSince, findByAdminUserId |
| `SystemConfigRepository` | SystemConfig | findByConfigKey, existsByConfigKey |
| `DianProviderRepository` | DianProvider | findByCode, findByIsEnabledTrue |
| `PaymentGatewayRepository` | PaymentGateway | findByCode, findByIsEnabledTrue |

## Criterios de aceptación

- [x] 11 repositorios creados extendiendo JpaRepository
- [x] Anotación @Repository en cada uno
- [x] Métodos de consulta derivados de nombres (Spring Data JPA)
- [x] Consultas personalizadas con @Query y @Param
- [x] Pageable en consultas que requieren paginación
- [x] Compilación exitosa
