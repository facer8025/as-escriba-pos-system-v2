# IS-005: Ventas en Espera (Pausar/Reanudar) en POS

- **Épica:** EP-009 (Frontend completo)
- **Prioridad:** Media
- **Estimado:** 1 día
- **Dependencias:** Ninguna

---

## Descripción

Implementar la funcionalidad de "Pausar venta" en el POS, permitiendo al cajero guardar una venta en curso, liberar el POS para una nueva venta, y luego reanudar la venta pausada. Las ventas en espera se persisten en `localStorage` para que sobrevivan a recargas de página.

---

## Especificación (basada en documento original 4.2)

### Funcionalidad: Pausar venta
- **Disparador:** Botón "Pausar venta" o tecla `F9`
- **Requiere:** Al menos 1 producto en el carrito

#### Flujo
1. Cajero hace clic en "Pausar venta" (F9)
2. El sistema guarda el estado completo de la venta:
   - Items del carrito con cantidades y subtotales
   - Cliente seleccionado (si aplica)
   - Descuento global (tipo y valor)
   - Tipo de documento seleccionado
   - Timestamp de cuando se pausó
3. El POS se limpia: carrito vacío, cliente sin seleccionar, descuento a 0
4. Aparece un toast confirmando: `"Venta pausada — N productos, $XXX"`
5. El cajero puede iniciar una nueva venta inmediatamente
6. Las ventas en espera se persisten en `localStorage`

### Funcionalidad: Reanudar venta
- **Disparador:** Botón "Ventas en espera (N)" o panel de ventas pausadas
- **Acceso:** Desde el panel lateral/modal de ventas en espera

#### Flujo
1. Cajero hace clic en "Ventas en espera (N)" en el panel derecho del POS
2. Se abre un modal con la lista de ventas pausadas
3. Cada venta muestra: # productos, total, tiempo transcurrido, cliente
4. Cajero hace clic en "Reanudar" (ícono ▶)
5. El carrito se restaura con todos los items, cliente, descuentos y tipo de documento
6. La venta se elimina de la lista de pausadas
7. Toast de confirmación: `"Venta reanudada"`

### Funcionalidad: Descartar venta en espera
- **Disparador:** Botón 🗑️ en cada item del panel
- **Acción:** Elimina la venta de la lista de pausadas sin restaurarla

---

## Criterios de aceptación

- [ ] Al hacer clic en "Pausar venta" con items en el carrito:
  - La venta se guarda con todos sus datos
  - El POS se limpia para nueva venta
  - Aparece toast de confirmación
- [ ] Al presionar F9: mismo comportamiento que el botón
- [ ] El botón "Pausar venta" se deshabilita si el carrito está vacío
- [ ] Aparece un botón "Ventas en espera (N)" cuando hay ventas pausadas
- [ ] Al hacer clic en "Ventas en espera (N)": se abre modal con la lista
- [ ] Cada venta muestra: cantidad de productos, total, tiempo, cliente
- [ ] Al reanudar: se restauran items, cliente, descuentos y tipo de documento
- [ ] Al descartar: se elimina de la lista sin restaurar
- [ ] Las ventas en espera persisten en localStorage al recargar la página
- [ ] Al reanudar una venta, se elimina de localStorage

---

## Archivos modificados

- `frontend/src/pages/pos/POSPage.tsx`
  - Estado `pausedSales` (inicializado desde localStorage)
  - Estado `showPausedPanel`
  - Funciones: `handlePauseSale`, `handleResumeSale`, `handleDeletePausedSale`, `formatPausedTime`
  - Efecto para persistir en localStorage
  - Modal de ventas en espera
  - Botón "Ventas en espera (N)" en panel derecho
  - Tecla F9 conectada a `handlePauseSale`
