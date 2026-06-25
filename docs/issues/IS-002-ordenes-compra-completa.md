# IS-002: Flujo Completo de Órdenes de Compra

- **Épica:** EP-009
- **Prioridad:** Alta
- **Estimado:** 2 días
- **Dependencias:** IS-001

## Descripción
Implementar el flujo completo de órdenes de compra: creación, envío, recepción de mercancía.

## Criterios de aceptación

### Lista de órdenes
- [ ] Tabla con filtros por estado, proveedor, fechas
- [ ] Badges de color por estado (Borrador → Enviada → Confirmada → Recibida)
- [ ] Acciones por fila: Ver, Editar (borrador), Recibir, Cancelar

### Crear orden
- [ ] Buscador de proveedor con autocompletado
- [ ] Tabla dinámica de productos con cantidad y costo unitario
- [ ] Panel de totales en vivo (subtotal, descuentos, IVA, total)
- [ ] Botones: Guardar borrador / Guardar y enviar

### Recepción de mercancía
- [ ] Tabla con cantidad pedida vs cantidad recibida
- [ ] Campo de novedad por producto (dañado, faltante, excedente)
- [ ] Confirmación actualiza inventario automáticamente
- [ ] Soporte para recepciones parciales

## API endpoints
- `GET /purchase-orders` (ya implementado)
- `POST /purchase-orders` (ya implementado)
- `PUT /purchase-orders/{id}/receive` (pendiente)
