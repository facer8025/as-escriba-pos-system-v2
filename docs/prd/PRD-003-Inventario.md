# PRD: ESCRIBA POS — Gestión de Inventario

## Problem Statement
Los bodegueros y administradores necesitan gestionar el stock de productos: registrar entradas y salidas de mercancía, ajustar inventario, consultar el kardex de cada producto, y recibir alertas de stock mínimo.

## Solution
Módulo de inventario con 6 sub-páginas: Resumen (estadísticas + tabla de productos), Entradas, Salidas, Ajustes, Kardex, y Alertas. Cada una conectada a los endpoints REST del backend.

## User Stories
1. Como bodeguero, quiero registrar una entrada de mercancía con cantidad y costo, para actualizar el inventario
2. Como bodeguero, quiero registrar una salida por daño o vencimiento, para mantener el stock real
3. Como administrador, quiero hacer ajustes rápidos de stock, para corregir diferencias de inventario
4. Como administrador, quiero consultar el kardex de un producto, para ver su historial de movimientos
5. Como cualquier usuario, quiero ver alertas de productos sin stock o con stock crítico

## Implementation Decisions
- Resumen usa `GET /inventory/summary` para estadísticas reales + `GET /products` para tabla paginada
- Entradas/Salidas con buscador de productos, selector de bodega, y tabla dinámica de items
- Ajustes con modal rápido: entrada, salida o ajuste directo de cantidad
- Kardex con selector de producto y tabla de movimientos ordenados por fecha
- Alertas calculadas desde `GET /products` filtrado por stock actual vs mínimo
- `refetchInterval: 30000` en todas las consultas para datos frescos

## API Contracts
- `GET /api/v1/inventory/summary?companyId=X`
- `GET /api/v1/inventory/warehouses?companyId=X`
- `POST /api/v1/inventory/entries`
- `POST /api/v1/inventory/exits`
- `POST /api/v1/inventory/adjustments`
- `GET /api/v1/inventory/movements?productId=X`
- `GET /api/v1/inventory/kardex/{productId}`

## Out of Scope
- Transferencias entre bodegas (placeholder)
- Escaneo de códigos de barras con cámara
- Generación automática de órdenes de compra por stock mínimo
