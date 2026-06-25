# PRD: ESCRIBA POS — Punto de Venta (POS)

## Problem Statement
Los cajeros necesitan un sistema rápido e intuitivo para registrar ventas en mostrador, con capacidad de buscar productos, aplicar descuentos, gestionar múltiples formas de pago, generar documentos fiscales y pausar/reanudar ventas.

## Solution
Pantalla completa de POS con tres columnas: búsqueda de productos (30%), carrito de compras (45%), y panel de pago/cliente (25%). Conectado al backend via API REST para persistir ventas y actualizar inventario en tiempo real.

## User Stories
1. Como cajero, quiero buscar productos por nombre o código de barras, para agregarlos rápidamente al carrito
2. Como cajero, quiero ver el desglose de IVA por producto y total, para cumplir con la normativa colombiana
3. Como cajero, quiero seleccionar el tipo de documento (Ticket POS / Factura Electrónica), para generar el comprobante adecuado
4. Como cajero, quiero buscar y seleccionar clientes, para asociarlos a la venta
5. Como cajero, quiero pausar una venta y reanudarla después, para atender a otro cliente urgente
6. Como administrador, quiero que las ventas se persistan en BD con descuento de stock, para tener inventario actualizado

## Implementation Decisions
- Layout de 3 columnas (30/45/25) sin sidebar, con header minimalista
- Búsqueda de productos via `GET /products?search=&categoryId=`
- Clientes via buscador autocompletable + modal de creación rápida
- Carrito con cantidad editable (input numérico), botones +/- y cálculo automático de IVA
- Modal de pago con selección de tipo documento + medios de pago
- Al confirmar: `POST /sales` que persiste venta, descuenta stock y genera documento
- Ventas en espera guardadas en localStorage con persistencia

## API Contracts
- `POST /api/v1/sales` — Crear venta (items, pagos, tipo documento, cliente)
- `GET /api/v1/products?search=&categoryId=` — Buscar productos
- `GET /api/v1/customers/search?term=` — Buscar clientes
- `POST /api/v1/customers` — Crear cliente rápido

## Out of Scope
- Impresión física por puerto serie (solo preview HTML)
- Integración con datáfonos (solo captura manual de referencia)
- Escáner de código de barras por cámara (solo placeholder)
