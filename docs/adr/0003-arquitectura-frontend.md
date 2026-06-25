# ADR-0003: Arquitectura del Frontend

**Fecha:** 2026-06-21
**Estado:** Aceptado
**Contexto:** Definir la estructura del frontend React.

## Decisión

| Aspecto | Tecnología | Justificación |
|---------|-----------|---------------|
| Build tool | Vite 6 | Hot reload instantáneo, build rápido |
| Estado global | Zustand | Simple, sin boilerplate, persist middleware |
| Data fetching | TanStack Query | Cache, refetch, paginación |
| Routing | React Router v7 | Estándar de facto, layouts anidados |
| Estilos | TailwindCSS | Utility-first, dark mode nativo |
| Íconos | Lucide React | 1000+ íconos, tree-shakeable, consistentes |
| Gráficos | Recharts | Reactivo, customizable, responsive |
| Formularios | React Hook Form + Zod | Performante, validación tipada |
| HTTP | Axios | Interceptors, refresh token automático |

## Estructura de carpetas

```
src/
├── layouts/       # MainLayout, POSLayout, Sidebar, Header
├── pages/         # Cada módulo en su carpeta
│   ├── auth/
│   ├── dashboard/
│   ├── pos/
│   ├── products/
│   ├── inventory/
│   ├── suppliers/
│   ├── facturacion/
│   ├── reportes/
│   └── configuracion/
├── components/    # UI reutilizables
│   ├── ui/        # Botones, inputs, modales genéricos
│   └── shared/    # Componentes de negocio reutilizables
├── stores/        # Zustand stores (auth, UI)
├── services/      # Axios API client
├── types/         # TypeScript interfaces
└── lib/           # Utilidades (formatCurrency, cn, fechas)
```
