# IS-004: Flujo de Venta Completo — Clientes, Persistencia, Tipo de Factura

- **Épica:** EP-009 (Frontend completo) / EP-010 (Facturación DIAN)
- **Prioridad:** 🔴 Crítica
- **Estimado:** 5 días
- **Dependencias:** Backend de ventas y facturación debe estar implementado

---

## Descripción

El flujo de venta actual en el POS es completamente **mock**: al confirmar el pago solo muestra un toast de éxito sin persistir la venta, sin descontar stock, sin registrar la factura, y sin preguntar el tipo de documento. Además, falta el módulo de clientes necesario para facturar con datos del receptor.

---

## Problemas identificados

### 1. Sin módulo de clientes
- **Archivo:** `POSPage.tsx`
- **Problema:** El selector de cliente es un botón mock que siempre muestra "Consumidor Final (CF)". No hay:
  - API de clientes implementada
  - Búsqueda de clientes por nombre, CC o NIT
  - Modal de creación rápida de cliente (especificado en 4.2.1)
  - Almacenamiento de datos del cliente en la venta

### 2. Sin selección de tipo de factura
- **Archivo:** `POSPage.tsx` (modal de pago)
- **Problema:** No existe la sección de selección de tipo de documento que la especificación describe en 4.3:
  - Ticket de caja (POS)
  - Documento equivalente electrónico POS
  - Factura electrónica
- **Impacto:** Todas las ventas se quedan sin documento fiscal asociado

### 3. Sin persistencia de ventas
- **Archivo:** `POSPage.tsx` (línea ~540, `handleConfirmPayment`)
- **Problema:** El botón "Confirmar pago" solo ejecuta:
  ```tsx
  toast.success('¡Venta registrada exitosamente!');
  setCart([]);
  setPayments([]);
  setShowPayment(false);
  ```
  No llama a ninguna API para guardar la venta en backend.

### 4. Sin actualización de stock post-venta
- **Causa raíz:** Como la venta no se persiste, el stock nunca se descuenta.
- **Impacto:** Catálogo de productos, dashboard, y kardex muestran stock desactualizado.

---

## Criterios de aceptación

### Módulo de Clientes (nuevo)

- [ ] API CRUD de clientes (backend):
  - `GET /api/v1/customers?search=texto` — búsqueda por nombre, CC, NIT
  - `POST /api/v1/customers` — crear cliente
  - `GET /api/v1/customers/{id}` — detalle
  - `PUT /api/v1/customers/{id}` — actualizar
- [ ] Página de listado de clientes: `/clientes` (sidebar: Configuración > Clientes)
- [ ] Modal de creación rápida desde el POS (especificación 4.2.1):
  - Tipo ID: CC / NIT / CE / Pasaporte
  - Número de identificación
  - Nombre / Razón social
  - Teléfono
  - Email
  - Tipo de cliente: Minorista / Mayorista
- [ ] Al seleccionar cliente en POS: mostrar nombre, tipo, puntos
- [ ] Datos del cliente se asocian a la venta y aparecen en la factura

### Selección de tipo de documento (en modal de pago)

- [ ] Sección "Tipo de documento" con 3 opciones:
  - 🧾 Ticket de caja (POS) — documento interno, sin DIAN
  - 🧾 Documento equivalente electrónico POS — para DIAN cuando aplica
  - 📄 Factura electrónica — requiere datos del receptor
- [ ] Si se selecciona Factura Electrónica y hay cliente: campos pre-llenados
- [ ] Si no hay cliente y se selecciona FE: solicitar datos mínimos

### Persistencia de venta (backend + frontend)

- [ ] API `POST /api/v1/sales` que recibe:
  - Lista de ítems (productId, quantity, price, discount, vatRate, etc.)
  - Lista de pagos (method, amount, reference)
  - CustomerId (opcional)
  - DocumentType (TICKET / POS_EQUIVALENT / INVOICE)
- [ ] La API debe en secuencia:
  1. Validar stock disponible para todos los ítems
  2. Descontar inventario (generar movimiento kardex)
  3. Registrar la venta con sus ítems y pagos
  4. Generar el documento fiscal correspondiente
  5. Actualizar saldo de caja
  6. Si aplica: enviar a DIAN (o marcar pendiente)
- [ ] Frontend: llamar a `POST /api/v1/sales` al confirmar pago
- [ ] Manejo de errores: stock insuficiente, error DIAN, etc.

### Actualización de stock

- [ ] Post-venta: stock descontado automáticamente (backend)
- [ ] Dashboard se actualiza con `refetchInterval: 30000` (ya configurado)
- [ ] Catálogo de productos se actualiza con `refetchInterval: 30000` (ya configurado)
- [ ] Página de inventario refleja cambios

---

## API endpoints necesarios

| Método | Ruta | Propósito |
|--------|------|-----------|
| `GET` | `/api/v1/customers?search=&type=` | Búsqueda de clientes |
| `POST` | `/api/v1/customers` | Crear cliente |
| `GET` | `/api/v1/customers/{id}` | Detalle cliente |
| `PUT` | `/api/v1/customers/{id}` | Actualizar cliente |
| `POST` | `/api/v1/sales` | Registrar venta completa |
| `GET` | `/api/v1/sales/{id}` | Detalle de venta |
| `GET` | `/api/v1/invoices?status=&page=` | Listar facturas |
| `GET` | `/api/v1/invoices/{id}` | Detalle factura |

---

## Archivos a modificar/crear

### Frontend
- `frontend/src/pages/pos/POSPage.tsx` — cliente, tipo doc, persistencia
- `frontend/src/pages/clientes/ClientesPage.tsx` — nuevo listado de clientes
- `frontend/src/pages/clientes/ClienteFormPage.tsx` — nuevo formulario cliente
- `frontend/src/pages/facturacion/InvoicesPage.tsx` — datos reales desde API
- `frontend/src/layouts/Sidebar.tsx` — agregar "Clientes" al menú

### Backend
- `backend/src/main/java/.../controller/CustomerController.java` — nuevo
- `backend/src/main/java/.../service/CustomerService.java` — nuevo
- `backend/src/main/java/.../controller/SaleController.java` — nuevo
- `backend/src/main/java/.../service/SaleService.java` — flujo completo
- `backend/src/main/java/.../entity/Customer.java` — entidad (si no existe)
- `backend/src/main/java/.../repository/CustomerRepository.java`

### Base de datos
- Migración Flyway para tabla `customers` (si no existe)
