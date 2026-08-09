# ESCRIBA POS System v2 — Contexto de Dominio

## Nombre clave
`as-escriba-pos-system-v2`

## Stack
### Panel Cliente (app.escriba.co)
- **Frontend**: React 19 + Vite 6 + TypeScript + TailwindCSS + Zustand
- **Backend**: Spring Boot 3.4 + Java 21 + PostgreSQL 16 + Redis 7
- **Infra**: Docker Compose, Nginx, Flyway

### Panel Administrativo (admin.escriba.co) — NUEVO 🚧
- **Frontend**: React 19 + Vite 6 + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: Spring Boot 3.4 (mismo proyecto, módulo `admin/` separado)
- **Base de datos**: PostgreSQL 16 (schema `public` para datos de gestión global)
- **Autenticación**: JWT RS256 (par de llaves separado) + TOTP obligatorio
- **Seguridad**: IP whitelist, rate limiting, sesiones 4h, bloqueo tras 3 intentos

## Dominio
Sistema POS (Punto de Venta) e inventario multi-empresa, multi-sucursal, multi-caja.
Diseñado para el mercado colombiano con facturación electrónica DIAN.

## Modelo Tributario — IVA Colombia (Ley 1819/2016 + Ley 2277/2022)

### Tarifas de IVA vigentes (2025)

| Tarifa | Código DIAN | Aplica a | Ejemplos |
|--------|-------------|----------|----------|
| **19%** (General) | `01` | Mayoría de bienes y servicios | Electrónicos, ropa, bebidas, procesados, aseo |
| **5%** (Reducido) | `02` | Alimentos básicos e insumos agrícolas | Café, maíz, arroz, trigo, transporte público terrestre |
| **Excluido** (0%) | `03` | Alimentos frescos, salud, educación | Carnes, pescados, leche, huevos, frutas, verduras, pan, medicamentos |
| **Exento** (0%) | `04` | Exportaciones, servicios internacionales | Bienes exportados |

### Configuración de IVA por producto

Cada producto tiene IVA **totalmente configurable**:
- `vat_type`: STANDARD / REDUCED / EXCLUDED / EXEMPT / ZERO / NOT_APPLICABLE
- `vat_rate`: Porcentaje configurable (0.00 a 100.00)
- `vat_included`: Si el precio de venta ya incluye el IVA

### Parámetros globales de IVA (por empresa)

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `default_vat_rate` | `19` | Tarifa IVA por defecto para nuevos productos |
| `price_includes_vat` | `true` | Precios incluyen IVA por defecto |
| `show_vat_on_ticket` | `true` | Mostrar IVA desglosado en el ticket POS |
| `vat_rates_available` | `19,5,0` | Tarifas disponibles para selección |
| `dian_iva19_code` | `01` | Código DIAN para IVA 19% |
| `dian_iva5_code` | `02` | Código DIAN para IVA 5% |
| `dian_excluded_code` | `03` | Código DIAN para excluidos |
| `dian_exempt_code` | `04` | Código DIAN para exentos |

### Cálculo de precios con IVA

```
Precio sin IVA = Precio venta / (1 + vat_rate/100)   [si vat_included = true]
IVA            = Precio sin IVA × vat_rate/100
Precio final   = Precio sin IVA + IVA                  [si vat_included = false]
```

## Módulos — Panel Cliente (10 MVP)

### Módulo 1 — Autenticación y Usuarios
- Login con JWT, refresh tokens, bloqueo por intentos
- Roles: SA (Superadmin), AD (Administrador), CA (Cajero), BO (Bodeguero), VE (Vendedor)
- Recuperación de contraseña con tokens
- Perfil de usuario con preferencias (tema, idioma)

### Módulo 2 — Catálogo de Productos
- CRUD completo de productos con imágenes, códigos de barras, precios
- Categorías jerárquicas (3 niveles) con colores e íconos
- Marcas, unidades de medida
- IVA configurable (0%, 5%, 19%, Exento, Excluido)
- Control de inventario por producto

### Módulo 3 — Inventario
- Kardex completo (costo promedio ponderado)
- Entradas/salidas manuales
- Toma de inventario (conteo ciego)
- Traslados entre bodegas
- Alertas de stock mínimo
- Semáforo de stock (verde/amarillo/rojo)

### Módulo 4 — Punto de Venta (POS)
- Pantalla completa 3 columnas (búsqueda/ítems/pago)
- Productos reales desde API con IVA configurable por producto
- Cálculo fiscal completo:
  - Base gravable (sin IVA)
  - Desglose de IVA por tarifa (STANDARD 19%, REDUCED 5%, EXCLUIDO, EXENTO)
  - Precio con IVA incluido o sin incluir (según configuración del producto)
  - Descuento global y su efecto proporcional en el IVA
- Apertura y cierre de caja con denominaciones
- Múltiples medios de pago (Efectivo, Tarjeta, Nequi, Daviplata, Transferencia, Crédito)
- Descuentos por ítem y globales
- Ventas en espera (pausar/reanudar)
- Devoluciones con reversión de inventario
- Atajos de teclado (F1, F9, F12, Esc)

### Módulo 5 — Facturación Electrónica DIAN
- Configuración de proveedor tecnológico (Factus, Alanube, etc.)
- Resoluciones de numeración
- Envío/recepción de facturas electrónicas
- Notas crédito
- CUFE, QR, estados DIAN

### Módulo 6 — Medios de Pago
- Configuración por empresa de cada medio
- Efectivo, tarjeta (Redeban/Credibanco), Nequi, Daviplata, transferencia, cartera
- Conciliación de pagos

### Módulo 7 — Proveedores y Órdenes de Compra
- Directorio de proveedores con contactos múltiples
- Órdenes de compra con flujo: Borrador → Enviada → Confirmada → En camino → Recibida
- Recepción de mercancía con control de novedades
- Actualización automática de inventario al recibir

### Módulo 8 — Dashboard
- Widgets: ventas del día, stock crítico, caja actual, top productos, órdenes activas
- Gráficos con Recharts
- Personalizable por usuario (drag & drop)

### Módulo 9 — Reportes
- Ventas por período (con gráficos)
- Cierre de caja detallado
- Inventario valorizado
- Compras por proveedor
- Exportación a Excel y PDF

### Módulo 10 — Configuración
- Empresa (datos, apariencia, SMTP)
- Sucursales y cajas
- Parámetros del sistema (seguridad, inventario, ventas, impuestos)
- Catálogos (unidades, ubicaciones, tipos ID, marcas, motivos, bancos)
- Notificaciones (in-app, email)

## Módulos — Panel Administrativo (12 módulos) — NUEVO 🚧

| # | Módulo | Descripción | Prioridad |
|---|--------|------------|-----------|
| 1 | Dashboard global | KPIs, gráficas MRR, estado del sistema, feed actividad | Alta |
| 2 | Gestión de empresas | CRUD empresas, ficha con pestañas, impersonation | Alta |
| 3 | Planes y precios | Catálogo de planes, límites operativos, módulos incluidos | Alta |
| 4 | Licencias | CRUD licencias, historial, upgrade/downgrade, renovación | Alta |
| 5 | Facturación y cobros | Emitir facturas, registrar pagos, cartera vencida, reportes | Alta |
| 6 | Módulos y feature flags | Módulos por empresa, feature flags globales con rollout | Media |
| 7 | Usuarios administradores | CRUD admins, roles (SA/AC/AF/ST/AU), 2FA, logs | Alta |
| 8 | Soporte y tickets | Bandeja, conversaciones, SLA, reportes | Alta |
| 9 | Comunicaciones | Redactor, segmentación, plantillas, mantenimiento | Media |
| 10 | Monitoreo del sistema | Health checks, métricas por tenant, log errores, cola DIAN | Media |
| 11 | Auditoría global | Log append-only, alertas seguridad, exportación | Alta |
| 12 | Configuración global | Parámetros sistema, proveedores DIAN, pasarelas pago, SMTP | Media |

## Términos del dominio

### Panel Cliente

| Término | Definición |
|---------|-----------|
| Tenant | Empresa cliente del sistema ESCRIBA |
| Caja | Punto físico de cobro asociado a una sucursal |
| Turno | Sesión de caja abierta por un cajero |
| Kardex | Registro histórico de movimientos de inventario de un producto |
| Bodega | Almacén físico asociado a una sucursal |
| Resolución DIAN | Autorización de numeración para facturar electrónicamente |
| CUFE | Código Único de Factura Electrónica (hash de la factura) |
| Proveedor tecnológico | Intermediario autorizado por DIAN para transmitir documentos |
| Toma de inventario | Conteo físico de productos para ajustar el stock del sistema |
| Documento equivalente POS | Documento tributario simplificado para ventas minoristas |

## Términos del dominio — Panel Administrativo

| Término | Definición |
|---------|-----------|
| Tenant | Empresa cliente del sistema ESCRIBA, con su propio schema en PostgreSQL |
| Super Admin (SA) | Rol con acceso completo al panel administrativo. Crea otros Super Admins |
| Admin Comercial (AC) | Gestiona empresas, planes, licencias y comunicaciones |
| Admin Financiero (AF) | Gestiona facturación, cobros y reportes financieros |
| Soporte Técnico (ST) | Accede a empresas (solo lectura), tickets y monitoreo |
| Auditor (AU) | Solo lectura total en todos los módulos |
| Impersonation | Acceso temporal de un admin al panel de una empresa cliente (máx 2h) |
| MRR | Monthly Recurring Revenue — ingresos recurrentes mensuales por licencias |
| ARR | Annual Recurring Revenue — proyección anual (MRR × 12) |
| Churn Rate | % de empresas canceladas respecto al total activo al inicio del mes |
| Feature Flag | Toggle global para activar/desactivar funcionalidades en producción sin deploy |
| SLA | Service Level Agreement — tiempo máximo de respuesta para tickets de soporte |
| Append-only | Los logs de auditoría son inmutables; solo se insertan, nunca se actualizan |
| CUFE | Código Único de Factura Electrónica DIAN |

## Reglas de negocio clave

### Panel Cliente
1. **Stock**: Una venta descuenta inventario automáticamente. Una devolución lo revierte.
2. **Costo**: Se usa promedio ponderado para valorar inventario.
3. **Caja**: No se puede operar el POS sin una sesión de caja abierta.
4. **Descuentos**: Los cajeros tienen un límite de descuento configurable (%).
5. **Anulación**: Solo el administrador puede anular ventas, y requiere contraseña.
6. **DIAN**: Si falla el envío a DIAN, la venta se guarda como válida y se reintenta en background.
7. **Multi-empresa**: Cada empresa (tenant) tiene datos completamente aislados.

### Panel Administrativo
1. **Separación total**: Ningún usuario del panel de empresas puede acceder al panel admin.
2. **2FA obligatorio**: Todos los admins deben tener TOTP configurado.
3. **Sesiones cortas**: JWT de 4h, refresh de 8h, impersonation de 2h.
4. **Bloqueo rápido**: 3 intentos fallidos de login bloquean la cuenta.
5. **Logs inmutables**: Los logs de auditoría son append-only; ningún admin puede borrarlos.
6. **Impersonation trazado**: Cada acceso a empresa queda registrado con motivo y duración.
7. **Aislamiento de datos**: El panel admin solo lee datos de tenants mediante funciones controladas.
8. **Resiliencia**: Si el panel admin cae, las empresas operan sin afectación.
9. **Auditoría exportable**: Los logs se exportan con hash de integridad para auditorías externas.

## Patrones arquitectónicos

- **Backend**: Arquitectura por capas (Controller → Service → Repository → Entity)
- **Frontend**: Feature-based organization with shared components
- **Seguridad**: JWT stateless con refresh tokens (RS256 para admin, HS256 para clientes)
- **Base de datos**: Flyway para migraciones, UUIDs como PKs
- **Caché**: Redis para sesiones y datos frecuentes
- **Admin API**: Prefijo `/api/v1/admin/` en el mismo backend pero como módulo separado
