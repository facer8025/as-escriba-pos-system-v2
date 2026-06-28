# IS-007: Exportación de Módulos — Inventario Resumen y Catálogo de Productos (PDF, Excel, CSV)

- **Épica:** EP-013
- **Prioridad:** Media
- **Estimado:** 1 día
- **Dependencias:** Ninguna

## Descripción

Implementar la funcionalidad de exportación en las pantallas:
1. **Resumen de Inventario** (`/inventario`) — botón Exportar sin funcionalidad previa
2. **Catálogo de Productos** (`/productos`) — botón Exportar solo CSV (API + fallback cliente)

Ambos se reemplazan por un menú desplegable con tres opciones: **PDF**, **Excel** y **CSV**.

La exportación es **100% client-side** (excepto CSV que en Catálogo intenta backend primero con fallback local): se toman los datos ya cargados en la página y se generan los archivos en el navegador, sin depender de nuevos endpoints de backend.

## Criterios de aceptación

- [x] Menú desplegable al hacer clic en "Exportar" con 3 opciones: PDF, Excel, CSV
- [x] Cada opción descarga el archivo correspondiente
- [x] CSV con BOM (UTF-8) para compatibilidad con Excel en español
- [x] Excel (`.xlsx`) con columnas ajustadas al contenido
- [x] PDF en orientación horizontal (landscape) con encabezado, resumen estadístico, tabla formateada y pie de página con numeración
- [x] Los datos exportados respetan el filtro de búsqueda y el filtro de stock activo
- [x] Menú se cierra al hacer clic fuera del dropdown
- [x] Íconos diferenciados por formato (PDF rojo, Excel verde, CSV azul)
- [x] Reporte Ventas por período: menú dropdown PDF / Excel / CSV
- [x] Reporte Inventario: menú dropdown PDF / Excel / CSV
  - [x] PDF: barra de título azul, tarjetas métricas tipo card con colores, tabla detallada con %
  - [x] Excel: 2 hojas (Resumen con formato profesional + Distribución con tabla)
  - [x] CSV: métricas con porcentajes calculados
- [x] Configuración > Catálogos: nuevo botón Exportar con menú dropdown PDF / Excel / CSV
  - [x] Exporta el catálogo activo (Unidades / Marcas / Bancos)
  - [x] PDF: orientación portrait con resumen de registros
  - [x] Excel: hoja con columnas dinámicas según el catálogo
  - [x] CSV: filas con todos los campos del catálogo activo

## Archivos modificados

- `frontend/src/lib/exportUtils.ts` — **REFACTOR**: diseño genérico con `exportGenericCsv`, `exportGenericExcel`, `exportGenericPdf`
  - `prepareInventoryRows` + funciones concretas `exportToCsv/Excel/Pdf`
  - `prepareCatalogRows` + funciones concretas `exportCatalogToCsv/Excel/Pdf`
- `frontend/src/pages/inventory/InventorySummaryPage.tsx` — Reemplazo del botón estático por dropdown con manejadores
- `frontend/src/pages/products/ProductsCatalogPage.tsx` — Reemplazo del botón estático por dropdown con manejadores (CSV mantiene intento API + fallback)
- `frontend/src/pages/reportes/SalesReportPage.tsx` — Reemplazo de "Exportar Excel" por dropdown con manejadores
- `frontend/src/pages/reportes/InventoryReportPage.tsx` — Reemplazo de "Exportar Excel" por dropdown con manejadores
- `frontend/src/pages/configuracion/CatalogsPage.tsx` — Añadido botón Exportar con menú dropdown PDF / Excel / CSV
- `frontend/package.json` — Dependencias añadidas: `xlsx`, `jspdf`, `jspdf-autotable`

## Dependencias instaladas

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `xlsx` | ^0.18.5 | Generación de archivos Excel (.xlsx) |
| `jspdf` | ^2.5.2 | Generación de PDF |
| `jspdf-autotable` | ^3.8.4 | Tablas en PDF con saltos de página automáticos |

## Diseño de la exportación

### Inventario (CSV)
- Separador: coma (`,`)
- Encoding: UTF-8 con BOM (`\uFEFF`)
- Textos con comillas escapadas
- Monetarios formateados con 2 decimales

### Catálogo de Productos (CSV)
- Mismo formato que Inventario
- Columnas: Producto, Código Interno, Código Barras, Categoría, Precio Compra, Precio Venta, Precio Mayorista, Stock Actual, Stock Mínimo, Stock Máximo, Costo Promedio, Tipo IVA, Estado
- Intenta `GET /products/export` primero; fallback client-side

### Inventario (Excel)
- Hoja única "Inventario"
- Columnas con ancho predefinido (`wch`)
- 10 columnas: Producto, Código Interno, Código Barras, Categoría, Stock Mínimo, Stock Actual, Stock Máximo, Costo Promedio, Valor Total, Estado Stock

### Catálogo de Productos (Excel)
- Hoja única "Catálogo de Productos"
- 13 columnas: Producto, Código Interno, Código Barras, Categoría, Precio Compra, Precio Venta, Precio Mayorista, Stock Actual, Stock Mínimo, Stock Máximo, Costo Promedio, Tipo IVA, Estado

### Reporte Ventas por Período (Excel)
- 2 hojas: "Resumen" (total ventas, transacciones, ticket promedio) + "Ventas" (tabla de ventas recientes)
- 6 columnas en Ventas: Venta, Fecha, Cliente, Subtotal, IVA, Total

### Reporte Ventas por Período (PDF)
- Orientación landscape
- Encabezado: "Reporte de Ventas por Período" + compañía + rango de fechas
- Resumen: total ventas, transacciones, ticket promedio
- Tabla de ventas recientes

### Reporte Inventario (Excel)
- 2 hojas: "Resumen" + "Distribución"
- Hoja Resumen: título con fondo azul, secciones "RESUMEN GENERAL" y "DISTRIBUCIÓN DE STOCK" con fondo gris, métricas en negrita, celda de valor inventario formateada como moneda ($#,##0)
- Hoja Distribución: tabla de 3 columnas (Métrica, Valor, % del total)
- Porcentajes calculados: con stock, stock bajo, sin stock

### Reporte Inventario (PDF)
- Orientación portrait (A4)
- Barra de título azul con nombre del reporte + compañía
- Fecha de corte a izquierda, fecha de generación a derecha
- 3 tarjetas métricas con colores: Total productos (azul), Con stock (verde), Sin stock (amarillo) — fondo coloreado, número grande
- Línea divisoria azul
- Tabla de 6 filas × 3 columnas: Métrica, Cantidad, % del total
- Encabezados centrados con fondo azul oscuro, filas alternadas
- Pie de página con numeración automática

### Inventario (PDF)
- Orientación: landscape (A4 horizontal)
- Encabezado: "Resumen de Inventario" + nombre de compañía
- Fecha de generación
- Resumen estadístico: total productos, stock crítico, sin stock, valor inventario
- 9 columnas en tabla

### Catálogo de Productos (PDF)
- Orientación: landscape (A4 horizontal)
- Encabezado: "Catálogo de Productos" + nombre de compañía
- Fecha de generación
- Resumen estadístico: total productos, activos, stock total, valor inventario
- 10 columnas en tabla

## API (sin cambios)

No se requieren cambios en el backend. Toda la exportación es client-side usando los datos de `GET /products` ya cargados en la página.

## Archivos de documentación actualizados

- `docs/prd/PRD-003-Inventario.md` — Añadida sección de exportación
- `docs/backlog/MASTER.md` — EP-013 actualizada (completada), EP-005 ampliada
- `docs/reports/STATUS.md` — Actualizado estado del módulo Inventario y Catálogo
- `docs/issues/IS-007-exportar-inventario.md` — Este documento
- `docs/INDEX.md` — Enlace al nuevo issue, módulos actualizados
