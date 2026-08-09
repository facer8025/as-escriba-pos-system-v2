# ADM-002: Configurar Módulo Spring Boot `admin/`

- **Épica:** EP-015 — Módulo Administrativo Global
- **Fase:** 1 — Fundación · **Sprint:** 1
- **Prioridad:** Alta
- **Estimado:** 1 día
- **Dependencias:** ADM-001 (Schema BD admin)

---

## Descripción

Configurar la estructura del módulo `admin/` dentro del backend Spring Boot existente para que todos los componentes del panel administrativo (controladores, servicios, repositorios, entidades, seguridad) sean descubiertos automáticamente por Spring Boot.

## Criterios de aceptación

- [x] Paquete `com.escriba.pos.admin` existe con subpaquetes estándar
- [x] `@SpringBootApplication` escanea automáticamente el subpaquete admin
- [x] Todos los beans admin son descubiertos sin configuración explícita
- [x] Los repositorios JPA del admin son detectados automáticamente
- [x] Las entidades JPA del admin son mapeadas correctamente
- [x] La aplicación compila y ejecuta sin errores de escaneo de componentes

## Estructura del módulo

```
com.escriba.pos.admin/
├── config/          ← AdminSecurityConfig, AdminDataInitializer
├── security/        ← AdminJwtTokenProvider, AdminJwtAuthenticationFilter, AdminJwtAuthenticationDetails
├── controller/      ← AdminAuthController, AdminDashboardController, AdminPlanController, AdminTenantController, AdminApiController
├── service/         ← AdminAuthService, DashboardService, PlanService, TenantService
├── repository/      ← 12 repositorios JPA
├── model/
│   ├── entity/      ← 13 entidades JPA (AdminUser, Tenant, Plan, License, etc.)
│   └── dto/         ← 12 DTOs (request/response)
└── exception/       ← (pendiente)
```

## Notas técnicas

El `@SpringBootApplication` en `EscribaPosApplication` (package `com.escriba.pos`) usa escaneo por defecto (`@ComponentScan` sin argumentos), lo que incluye automáticamente todos los subpaquetes incluyendo `com.escriba.pos.admin`.

No se requiere configuración adicional de `@ComponentScan`, `@EnableJpaRepositories` o `@EntityScan`.
