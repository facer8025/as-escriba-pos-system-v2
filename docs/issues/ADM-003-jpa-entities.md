# ADM-003: JPA Entities para Schema `public`

- **Épica:** EP-015 — Módulo Administrativo Global
- **Fase:** 1 — Fundación · **Sprint:** 1
- **Prioridad:** Alta
- **Estimado:** 2 días
- **Dependencias:** ADM-001 (Schema BD), ADM-002 (Módulo Spring Boot)

---

## Descripción

Crear las entidades JPA faltantes para completar el mapeo objeto-relacional de las 25 tablas del schema `public` del panel administrativo.

## Entidades creadas (11 nuevas + 13 existentes = 24 total)

### Existentes (13)
AdminRole, AdminUser, AdminRefreshToken, AdminAuditLog, Tenant, TenantModule, License, LicenseHistory, Plan, PlanModule, Module, SupportTicket, TenantInvoice

### Nuevas (11)
| Entidad | Tabla | PK | Módulo |
|---------|-------|----|--------|
| `FeatureFlag` | `feature_flags` | UUID | M6 — Feature Flags |
| `TenantFeatureFlag` | `tenant_feature_flags` | UUID | M6 — Feature Flags |
| `TicketMessage` | `ticket_messages` | UUID | M8 — Tickets |
| `Announcement` | `announcements` | UUID | M9 — Comunicaciones |
| `AnnouncementDelivery` | `announcement_deliveries` | UUID | M9 — Comunicaciones |
| `MaintenanceWindow` | `maintenance_windows` | UUID | M9 — Comunicaciones |
| `ServiceHealthLog` | `service_health_logs` | Long (IDENTITY) | M10 — Monitoreo |
| `SecurityAlert` | `security_alerts` | UUID | M11 — Auditoría |
| `SystemConfig` | `system_config` | Integer (IDENTITY) | M12 — Configuración |
| `DianProvider` | `dian_providers` | Integer (IDENTITY) | M12 — Configuración |
| `PaymentGateway` | `payment_gateways` | Integer (IDENTITY) | M12 — Configuración |

## Criterios de aceptación

- [x] 11 entidades JPA creadas con anotaciones Jakarta Persistence
- [x] Mapeo correcto de nombres de tablas y columnas
- [x] Relaciones @ManyToOne con FetchType.LAZY
- [x] UUIDs como PK (con `GenerationType.UUID` o `GenerationType.IDENTITY` para tablas con SERIAL/BIGSERIAL)
- [x] Timestamps con `@PrePersist` / `@PreUpdate`
- [x] Valores por defecto via `@Builder.Default`
- [x] Lombok: @Data, @NoArgsConstructor, @AllArgsConstructor, @Builder, @EqualsAndHashCode
- [x] Compilación exitosa sin errores de JPA
