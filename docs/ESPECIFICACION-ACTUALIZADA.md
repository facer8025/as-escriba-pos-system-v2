# 📋 ESCRIBA POS — Especificación Funcional Actualizada

> Basado en: `ESCRIBA_Especificacion_Funcional_MVP_MODULOS_1-10.md`
> Versión del sistema: 2.1.0
> Fecha de actualización: 2026-06-24

---

## Modelo Tributario — IVA Colombia (Agregado a Módulo 2 y 4)

### Clasificación de IVA por producto

Cada producto en el sistema tiene configuración individual de IVA:

| Campo | Tipo | Valores | Descripción |
|-------|------|---------|-------------|
| `vatType` | Enum | STANDARD, REDUCED, EXCLUDED, EXEMPT, ZERO, NOT_APPLICABLE | Clasificación tributaria |
| `vatRate` | Decimal | 0.00 - 100.00 | Porcentaje configurable |
| `vatIncluded` | Boolean | true / false | El precio de venta incluye IVA |

### Tarifas de IVA según normativa colombiana

| Clasificación | Tarifa 2025 | Código DIAN | Productos típicos |
|---------------|-------------|-------------|-------------------|
| **STANDARD** | 19% | `01` | Electrónicos, ropa, bebidas, procesados, aseo |
| **REDUCED** | 5% | `02` | Café, maíz, arroz, insumos agrícolas |
| **EXCLUDED** | No causa IVA | `03` | Carnes, pescados, leche, huevos, frutas, pan, medicamentos |
| **EXEMPT** | 0% (con derecho) | `04` | Exportaciones |
| **ZERO** | 0% temporal | — | Tasas especiales |
| **NOT_APPLICABLE** | N/A | — | Servicios financieros |

### Cálculo de precios en el POS

```
Si vatIncluded = true:
  Base = Precio venta / (1 + vatRate/100)
  IVA  = Precio venta - Base
  
Si vatIncluded = false:
  Base = Precio venta
  IVA  = Precio venta × vatRate/100
  Total = Base + IVA
```

### Visualización en el POS (Módulo 4.2)

- Cada producto muestra un **badge de IVA** en los resultados de búsqueda
- El carrito desglosa el IVA por tarifa (STANDARD 19%, REDUCED 5%, EXCLUIDO)
- En los totales se muestra:
  - **Base gravable** (suma de precios sin IVA)
  - **IVA** desglosado por tarifa
  - **Total** (base + IVA - descuentos)
- El modal de pago incluye el mismo desglose fiscal

### Parámetros configurables por empresa (Módulo 10.3)

Los siguientes parámetros de IVA son configurables desde Configuración > Parámetros > Impuestos:

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `default_vat_rate` | 19 | Tarifa por defecto para nuevos productos |
| `price_includes_vat` | true | Precios incluyen IVA por defecto |
| `show_vat_on_ticket` | true | Mostrar IVA desglosado en ticket |
| `vat_rates_available` | 19,5,0 | Tarifas disponibles |
| `dian_iva19_code` | 01 | Código DIAN para IVA 19% |
| `dian_iva5_code` | 02 | Código DIAN para IVA 5% |
| `dian_excluded_code` | 03 | Código DIAN para excluidos |
| `dian_exempt_code` | 04 | Código DIAN para exentos |

---

## Imágenes de Productos (Agregado a Módulo 2)

### Funcionalidad de subida de imágenes

El formulario de productos incluye una pestaña **Imágenes** que permite:
- **Subir imágenes** arrastrando archivos o haciendo clic en la zona de carga
- **Formatos soportados**: JPG, JPEG, PNG, WEBP
- **Tamaño máximo**: 5MB por imagen
- **Cantidad máxima**: 5 imágenes por producto
- **Imagen principal**: La primera imagen subida se marca como principal. Se puede cambiar desde la galería
- **Previsualización**: Las imágenes se muestran en una cuadrícula antes de subirse
- **Eliminación**: Cada imagen tiene un botón para eliminarla

### Endpoints de imágenes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/products/{id}/images` | Subir imagen (multipart/form-data) |
| `GET` | `/products/{id}/images` | Listar imágenes del producto |
| `DELETE` | `/products/{id}/images/{imageId}` | Eliminar imagen |
| `PUT` | `/products/{id}/images/{imageId}/primary` | Establecer imagen como principal |

### Flujo de subida

1. El usuario selecciona archivos (drag & drop o selector de archivos)
2. Se validan formato y tamaño en el cliente
3. Se muestra previsualización local
4. Al guardar el producto (o al hacer clic en "Subir imágenes" si ya existe), se envían los archivos al backend
5. El backend almacena el archivo en disco (`app.upload.path`) y guarda la referencia en `product_images`
6. Las imágenes se sirven desde `GET /uploads/{filename}` (acceso público sin autenticación)

### Almacenamiento

- **Directorio**: Configurable via `app.upload.path` en `application.yml` (default: `/uploads`)
- **Nombres**: UUID único para evitar colisiones
- **Limpieza**: Al eliminar una imagen, también se elimina el archivo del disco

### Visualización de imágenes en listados y detalle

El catálogo de productos y el detalle muestran las imágenes reales del producto:

- **Vista tabla**: Muestra miniatura 40×40px con la imagen principal (`mainImageUrl`)
- **Vista tarjetas**: Muestra la imagen ocupando el área superior de la tarjeta
- **Detalle de producto**: 
  - Imagen principal grande (192px) en la columna derecha
  - Galería de thumbnails debajo de la imagen principal
  - Modal de galería con navegación entre imágenes
  - Si no hay imágenes, se muestra un placeholder con ícono de Package

### Importación y Exportación de productos (Agregado a Módulo 2)

#### Botón Importar
Abre un modal **wizard de 3 pasos**:

**Paso 1 — Descargar plantilla**
- Botón `Descargar plantilla (.csv)` → descarga un archivo CSV con encabezados y ejemplo
- Botón `Ya tengo la plantilla` → avanza al paso 2

**Paso 2 — Cargar archivo**
- Zona de drag & drop o click para explorar archivos
- Formatos aceptados: CSV, XLSX
- Tamaño máximo: 10MB · Máximo 5000 filas
- Validación de formato al seleccionar el archivo
- Botón `Validar y siguiente` → avanza al paso 3

**Paso 3 — Validación y resultados**
- Resumen visual: N productos válidos / N con errores / Total filas
- Si hay errores, se muestran ejemplos de filas con problemas
- Opción de importar solo los productos válidos
- Botón `Importar N productos` → ejecuta la importación

#### Botón Exportar
- Descarga un archivo CSV con los productos visibles (aplicando filtros actuales)
- Si el endpoint de exportación del backend no está disponible, genera el CSV desde el frontend
- Nombre del archivo: `productos-{YYYY-MM-DD}.csv`

## Cambios respecto a la especificación original

### Módulo 2 — Productos
- ✅ IVA configurable por producto (ya estaba en el schema original)
- ✅ Badge de IVA en tabla y tarjetas (colores por tipo)
- ✅ Seed data actualizado con IVA colombiano correcto
- ✅ Subida y gestión de imágenes por producto (hasta 5 imágenes, drag & drop, máx 5MB)
- ✅ Endpoints CRUD de productos (POST /products, PUT /products/{id}) — antes solo GET
- ✅ Imágenes visibles en catálogo (tabla y grid), detalle y galería completa
- ✅ Botón Importar con modal wizard de 3 pasos (descarga plantilla, carga archivo, validación)
- ✅ Botón Exportar con descarga CSV (aplica filtros actuales)

### Módulo 4 — POS
- ✅ Productos reales desde API (antes: mock data)
- ✅ Desglose fiscal completo con IVA
- ✅ Cálculo de base gravable
- ✅ Badges de IVA en cada ítem del carrito
- ✅ Efecto del descuento global sobre el IVA (proporcional)

### Módulo 10 — Configuración
- ✅ 8 nuevos parámetros de IVA
- ✅ Migración V3 con datos actualizados
