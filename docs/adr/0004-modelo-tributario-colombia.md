# ADR-0004: Modelo Tributario Colombiano (IVA)

**Fecha:** 2026-06-22
**Estado:** Aceptado
**Contexto:** Definir el modelo de IVA para el sistema POS, alineado con la normativa colombiana.

## Decisión

### Estructura de IVA por producto

Cada producto en el sistema tiene 3 campos relacionados con IVA:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `vat_type` | ENUM | Clasificación tributaria (STANDARD, REDUCED, EXCLUDED, EXEMPT, ZERO, NOT_APPLICABLE) |
| `vat_rate` | DECIMAL(5,2) | Porcentaje de IVA configurable (0.00 - 100.00) |
| `vat_included` | BOOLEAN | Indica si el precio de venta ya incluye el IVA |

### Mapeo a normativa colombiana

| VatType | Tarifa Ley 1819 | Código DIAN | Descripción |
|---------|----------------|-------------|-------------|
| STANDARD | 19% | 01 | IVA General |
| REDUCED | 5% | 02 | IVA Reducido |
| EXCLUDED | 0% (no causa) | 03 | Excluido — bienes que no generan IVA |
| EXEMPT | 0% (con derecho) | 04 | Exento — tasa 0% con derecho a descuento |
| ZERO | 0% | — | Tasa 0% temporal |
| NOT_APPLICABLE | N/A | — | Servicios no gravados |

### Parámetros configurables por empresa

Los parámetros de IVA se almacenan en `system_parameters` y son configurables desde `Configuración > Parámetros > Impuestos`.

### Integración con el POS

En la pantalla de Punto de Venta (Módulo 4), el IVA se visualiza así:
1. **Badge por producto**: Cada resultado de búsqueda muestra un badge con el tipo de IVA
2. **Carrito**: Cada línea muestra el badge de IVA y el precio según aplique
3. **Totales**: Se desglosa:
   - Base gravable (suma de precios sin IVA)
   - IVA por tarifa (STANDARD 19%, REDUCED 5%, EXCLUDED - sin IVA, EXEMPT - 0%)
   - Descuento global (con efecto proporcional sobre el IVA)
   - Total (base - descuento + IVA)

### Cálculo de precios

```
Por producto:
  Si vatIncluded = true:
    Base = Precio / (1 + vatRate/100)
    IVA = Precio - Base
  Si vatIncluded = false:
    Base = Precio
    IVA = Precio × vatRate/100

Por venta:
  Base total = Σ (Base × cantidad)
  Descuento = Base total × (% descuento global)
  IVA total  = Σ (IVA × cantidad) × (1 - % descuento)
  Total      = Base total - Descuento + IVA total
```

## Consecuencias

- **Positivas:** Cada producto puede tener su propia configuración de IVA, lo que permite manejar excepciones sin modificar el código
- **Positivas:** Los parámetros globales permiten cambiar el comportamiento por defecto sin afectar productos existentes
- **Positivas:** El mapeo a códigos DIAN permite la facturación electrónica directa
- **Positivas:** El desglose fiscal en el POS da transparencia al cliente final
- **Negativas:** El vendedor debe seleccionar el tipo de IVA correcto al crear productos
- **Mitigación:** Los parámetros globales y valores por defecto reducen la fricción

## Referencias

- Ley 1819 de 2016 (Reforma Tributaria Estructural)
- Ley 2277 de 2022 (Reforma Tributaria)
- Decreto 1625 de 2016 (Único Reglamentario Tributario)
- Resolución DIAN 000085 de 2022 (Facturación Electrónica)
