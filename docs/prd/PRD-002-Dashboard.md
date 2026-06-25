# PRD: ESCRIBA POS — Dashboard y Reportes

## Problem Statement
Los administradores necesitan una visión rápida del estado del negocio: ventas del día, transacciones, stock crítico, y acceso a reportes históricos para la toma de decisiones.

## Solution
Dashboard con 4 widgets de métricas clave + gráfico de ventas + acceso rápido a funciones comunes. Módulo de reportes con ventas por período, inventario valorizado y reportes generales.

## User Stories
1. Como administrador, quiero ver ventas del día, transacciones y tendencia vs ayer, para evaluar el rendimiento
2. Como administrador, quiero ver el valor del inventario y productos sin stock, para tomar decisiones de compra
3. Como administrador, quiero consultar ventas por período con desglose diario, para analizar tendencias
4. Como administrador, quiero un reporte de inventario con distribución de stock, para conocer la salud del almacén

## Implementation Decisions
- Dashboard con `GET /dashboard/summary` (una query agrupada)
- Widgets con refetch automático cada 30 segundos
- Gráficos con Recharts (AreaChart para dashboard, BarChart para reportes, PieChart para inventario)
- Reporte de ventas con query nativa agrupada por día (evita N+1 queries)
- Colores suaves (#818cf8) para gráficos en ambos temas (light/dark)
- Tooltips con soporte de tema oscuro via CSS

## API Contracts
- `GET /api/v1/dashboard/summary?companyId=X`
- `GET /api/v1/reports/sales?companyId=X&dateFrom=&dateTo=`
- `GET /api/v1/reports/inventory?companyId=X`
- `GET /api/v1/reports/general?companyId=X`

## Out of Scope
- Exportación a Excel (placeholder)
- Reportes programados por email
- Dashboard personalizable por usuario (drag & drop)
