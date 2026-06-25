# 🐛 Registro de Incidencias — ESCRIBA POS v2

> **Última actualización:** 2026-06-23

---

## Incidencias activas

### BUG-003: Sin integración DIAN real
- **Fecha:** 2026-06-23
- **Reportado por:** Usuario
- **Módulo:** 5 — Facturación Electrónica DIAN
- **Severidad:** 🟡 Alto
- **Estado:** Abierto

#### Descripción
La facturación electrónica DIAN no está conectada a un proveedor tecnológico real. La generación de documentos electrónicos con CUFE, firma digital y envío a DIAN está pendiente de configuración.

#### Solución
Requiere configuración de proveedor tecnológico (Factus, Alanube, etc.) en `Configuración > DIAN`.

---

## Incidencias resueltas

### BUG-001: Ventas en POS no se persisten ni descuentan stock
- **Fecha:** 2026-06-23
- **Estado:** ✅ Resuelto
- **Solución:** 
  - **Backend**: Creado `SaleService.java` con flujo completo: validación stock → descuento inventario → registro venta → movimientos kardex → actualización cliente
  - **Backend**: Creado `CreateSaleRequest.java` DTO para recibir datos de venta
  - **Backend**: Creado `PaymentMethodRepository.java` para consultar medios de pago
  - **Backend**: Actualizado `SaleController.java` para usar SaleService
  - **Backend**: Agregado `countByCompanyIdAndSaleNumberStartingWith` a SaleRepository
  - **Frontend**: `POSPage.tsx` ahora llama a `POST /api/v1/sales` con todos los datos
  - **Frontend**: Al confirmar pago, invalida queries de dashboard, productos, facturas e inventario

### BUG-002: Sin módulo de clientes para facturación
- **Fecha:** 2026-06-23
- **Estado:** ✅ Resuelto
- **Solución:**
  - **Frontend**: Buscador de clientes en el POS con autocompletado (API `/customers/search`)
  - **Frontend**: Modal de creación rápida de cliente desde el POS
  - **Frontend**: Página `/clientes` con listado de clientes
  - **Frontend**: Ítem "Clientes" en el sidebar
  - **Backend**: CustomerController ya existía con CRUD completo

### BUG-003: Sin selección de tipo de documento en el pago
- **Fecha:** 2026-06-23
- **Estado:** ✅ Resuelto
- **Solución:**
  - **Frontend**: Agregado selector de tipo de documento en el modal de pago:
    - 🧾 Ticket POS (documento interno)
    - 📄 Factura electrónica (requiere cliente)

### BUG-004: Textos invisibles en tema oscuro
- **Fecha:** 2026-06-23
- **Estado:** ✅ Resuelto
- **Solución:** 15+ archivos corregidos con variantes `dark:text-primary-400/300`

### BUG-005: Datos no se refrescan automáticamente
- **Fecha:** 2026-06-23
- **Estado:** ✅ Resuelto
- **Solución:** `refetchInterval: 30000` en dashboard, productos, facturas y clientes + invalidación de queries post-venta
