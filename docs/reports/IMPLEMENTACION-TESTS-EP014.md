# 📋 Reporte de Implementación — EP-014: Pruebas Automatizadas

> **Tarea:** Iniciar suite de pruebas automatizadas (tests unitarios + integración)
> **Fecha:** 2026-08-08
> **Responsable:** Orquestador
> **Estado:** ✅ Parcialmente completado (2/3: unitarios + integración base)

---

## 1. Resumen

El proyecto no tenía ninguna prueba automatizada. Se creó la base de la suite de
tests con JUnit 5 + Mockito para los servicios de mayor riesgo (dominio financiero
y fiscal) y un test de integración con Testcontainers que replica el arranque de
docker-compose.

## 2. Tests unitarios creados

### `SaleServiceTest` — 10 tests (dominio fiscal crítico)
| Test | Valida |
|------|--------|
| Venta exitosa | Totales, número de venta secuencial, descuento de stock, registro kardex (cantidad negativa, stockBefore/After) |
| Empresa no encontrada | BusinessException, no persiste venta |
| Vendedor no encontrado | BusinessException |
| Producto no encontrado | BusinessException |
| Stock insuficiente | BusinessException, no descuenta stock ni registra movimiento |
| Descuento global % | 10% sobre subtotal aplicado correctamente |
| Descuento global fijo | min(valor, subtotal) — nunca total negativo |
| Medio de pago no encontrado | BusinessException |
| Sin control de inventario | No registra kardex ni guarda producto |
| Número secuencial | Incrementa según ventas previas del día |

### `AuthServiceTest` — 14 tests (seguridad)
Login exitoso (tokens + reset de intentos), login con sucursal, usuario inexistente,
contraseña incorrecta (incrementa intentos), cuenta desactivada, cuenta bloqueada,
bloqueo expirado, refresh token inválido/válido, cambio de contraseña (3 casos),
registro con email duplicado y registro exitoso.

### `PlanServiceTest` — 8 tests (módulo admin)
IVA por defecto 19% en planes, taxRate explícito, sin módulos, updatePlan con
reemplazo de módulos, plan inexistente, archivePlan, cálculo de descuento anual,
listado de planes activos.

## 3. Bug detectado y corregido 🔧

**Los initializers de Lombok en `Plan` se perdían con el builder** — campos como
`taxRate`, `trialDays`, `currency`, `badgeColor`, `isFeatured`, `isVisibleWeb`
quedaban `null` al construir con el builder (y al persistir), causando NPE en
`PlanService.toResponse` y datos incorrectos (IVA null en planes nuevos).

**Fix:** Agregado `@Builder.Default` a los 6 campos en `Plan.java`.

## 4. Test de integración

`EscribaPosApplicationIT` — levanta PostgreSQL 16 (con los mismos init scripts de
docker-compose) + Redis 7 vía Testcontainers y valida que el contexto Spring Boot
arranca por completo (beans, JPA mappings, Flyway V5 idempotente).

> ⚠️ **Nota de entorno:** En la máquina de desarrollo actual el kernel no soporta
> la creación de interfaces veth (no se pueden crear bridges Docker), por lo que
> Testcontainers no puede ejecutarse localmente. El test se ejecuta con
> `mvn verify` (maven-failsafe-plugin agregado) en un entorno con Docker completo
> (CI, Docker Desktop, servidores).

## 5. Infraestructura

- `pom.xml`: agregado `maven-failsafe-plugin` para ejecutar `*IT` en `mvn verify`
  (convención: `*Test` = unitarios con surefire, `*IT` = integración con failsafe).
- `mvn test` → 32 unitarios, sin necesidad de Docker.

## 6. Verificación

```
mvn test  → ✅ Tests run: 32, Failures: 0, Errors: 0, Skipped: 0 (BUILD SUCCESS)
```

## 7. Tests de frontend (Vitest) — frontend-admin

Se configuró Vitest 4 + Testing Library en `frontend-admin`:

### Infraestructura
- `vitest.config.ts` (jsdom, alias `@`, setup file)
- `src/test/setup.ts` (jest-dom + limpieza automática)
- `package.json`: scripts `test` / `test:watch`
- Tests excluidos del build de producción (`tsconfig.app.json`)

### Tests creados (50)
| Suite | Tests | Cubre |
|-------|-------|-------|
| `lib/utils.test.ts` | 19 | formatCurrency (COP), formatDate/DateTime, formatRelativeTime, cn (tailwind-merge), generateId, roles admin, estados empresa |
| `button.test.tsx` | 6 | Variantes, disabled, loading (spinner), onClick |
| `badge.test.tsx` | 10 | Variantes y mapeo de estados (StatusBadge) |
| `toggle.test.tsx` | 5 | aria-checked, label, onChange controlado, disabled |
| `search-input.test.tsx` | 4 | Placeholder, valor controlado, onChange |
| `admin-auth-store.test.ts` | 9 | login (éxito/TOTP/fallo), verifyTotp, logout, refreshSession, persistencia sessionStorage |

### Verificación
```
npm test      → ✅ Test Files 6, Tests 50, all passed
npm run build → ✅ tsc + vite build OK
```

## 8. Pendiente

- [ ] Tests de frontend del panel cliente (`frontend/`) — misma infraestructura
- [ ] Tests unitarios para más servicios backend: InventoryService (kardex/costo promedio),
      CashSessionService (cierre de caja), LicenseService (ciclo de vida licencias),
      InvoiceService (facturación admin)
