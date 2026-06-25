# IS-001: Pantallas de Inventario (Entradas, Salidas, Ajustes)

- **Épica:** EP-009
- **Prioridad:** Alta
- **Estimado:** 2 días
- **Dependencias:** Ninguna (backend listo)

## Descripción
Implementar las pantallas de gestión de inventario: registro de entradas, salidas, y ajuste rápido de stock.

## Criterios de aceptación

### Entradas de mercancía
- [ ] Formulario con tipo de entrada, proveedor, fecha
- [ ] Buscador de productos con soporte de código de barras
- [ ] Tabla dinámica de productos con cantidad y costo
- [ ] Confirmación genera movimiento en kardex y actualiza stock

### Salidas de inventario
- [ ] Formulario con motivo de salida (daño, vencimiento, robo, etc.)
- [ ] Validación de stock disponible antes de confirmar
- [ ] Alerta visual si cantidad supera el stock

### Ajuste rápido
- [ ] Modal desde lista de inventario
- [ ] Tipos: entrada, salida, ajuste directo
- [ ] Previsualización del nuevo stock

## Archivos a modificar
- `frontend/src/pages/inventory/`

## API endpoints
- `POST /inventory/movements` (ya implementado)
- `GET /inventory/movements?productId=X` (ya implementado)
