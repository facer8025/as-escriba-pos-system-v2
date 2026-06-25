# IS-003: Cierre de Caja con Denominaciones

- **Épica:** EP-009
- **Prioridad:** Alta
- **Estimado:** 1 día
- **Dependencias:** Ninguna

## Descripción
Implementar la pantalla de cierre de caja con conteo de denominaciones, diferencia, y reporte.

## Criterios de aceptación

### Pantalla de cierre
- [ ] Resumen del turno (ventas por medio de pago)
- [ ] Tabla de denominaciones para conteo físico
  - Billetes: $100.000, $50.000, $20.000, $10.000, $5.000, $2.000, $1.000
  - Monedas: $500, $200, $100
- [ ] Total contado calculado en tiempo real
- [ ] Diferencia (faltante/sobrante) con color rojo/verde
- [ ] Retiro de efectivo y base para siguiente turno

### Reporte generado
- [ ] PDF del cierre con logo de la empresa
- [ ] Ventas por medio de pago
- [ ] Cuadre de caja detallado
- [ ] Firmas del cajero y administrador

## Archivos a modificar
- `frontend/src/pages/pos/cash/CierreCajaPage.tsx`
- `backend/.../controller/CashSessionController.java`
