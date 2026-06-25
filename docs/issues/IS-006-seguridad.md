# IS-006: Análisis de Seguridad y Correcciones

- **Fecha:** 2026-06-24
- **Prioridad:** Alta
- **Estado:** Implementación parcial

---

## 1. Resumen de hallazgos

| # | Vulnerabilidad | Severidad | Implementado | Pendiente |
|---|---------------|-----------|-------------|-----------|
| 1 | XSS en `document.write` (impresión tickets) | 🔴 Alta | ✅ | — |
| 2 | Headers de seguridad HTTP faltantes | 🔴 Alta | ✅ | — |
| 3 | CSP (Content-Security-Policy) en frontend | 🔴 Alta | ✅ | — |
| 4 | Rate limiting en login endpoint | 🟡 Media | ✅ | — |
| 5 | JWT secret sin validación de longitud | 🟡 Media | ✅ | — |
| 6 | Tokens JWT en localStorage | 🟡 Media | — | ⏳ Pendiente |
| 7 | CSRF deshabilitado | 🟡 Media | — | ⏳ Pendiente |
| 8 | Sanitización de inputs de búsqueda | 🟢 Baja | — | ⏳ Pendiente |
| 9 | Logging de eventos de seguridad | 🟢 Baja | — | ⏳ Pendiente |

---

## 2. Implementado ahora ✅

### 2.1 XSS en impresión de tickets (document.write)
**Archivo:** `InvoicesPage.tsx`
**Solución:** Función `escapeHtml()` que sanitiza `saleNumber`, `customerName`, `documentNumber`, `product.name` antes de insertarlos en `document.write()`.

### 2.2 Headers de seguridad HTTP (nginx + Spring)
**Archivo:** `Dockerfile` (frontend), `SecurityConfig.java` (backend)
**Headers agregados:**

| Header | Valor | Dónde |
|--------|-------|-------|
| `X-Frame-Options` | `DENY` | Frontend nginx |
| `X-Content-Type-Options` | `nosniff` | Frontend nginx + Backend |
| `X-XSS-Protection` | `1; mode=block` | Frontend nginx |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Frontend nginx |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Backend |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Frontend nginx |

### 2.3 Content-Security-Policy (CSP)
**Archivo:** `Dockerfile` (frontend nginx)
```
default-src 'self'; script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline'; img-src 'self' data:;
font-src 'self' data:; connect-src 'self' http://localhost:*;
frame-ancestors 'none';
```

### 2.4 Rate limiting en login
**Archivo:** `RateLimitingFilter.java`
**Comportamiento:**
- Máximo 10 intentos de login por IP en ventana de 5 minutos
- HTTP 429 con mensaje JSON al exceder el límite
- Usa `ConcurrentHashMap` (no requiere Redis)
- Respeta header `X-Forwarded-For` para IPs detrás de proxy

### 2.5 JWT secret validation
**Archivo:** `JwtTokenProvider.java`
**Solución:** Valida que la clave tenga ≥ 256 bits. Si es menor, la rellena y emite warning en log.

---

## 3. Pendiente para próxima fase ⏳

### 3.1 Tokens JWT en localStorage → httpOnly cookies
**Riesgo:** localStorage es accesible desde cualquier JavaScript del mismo origen.
**Solución propuesta:** 
- Backend: setear access token como cookie `httpOnly + Secure + SameSite=Strict`
- Frontend: eliminar persistencia de tokens del store
- Requiere cambios en: `AuthService.java`, `api.ts`, `authStore.ts`

### 3.2 CSRF
**Riesgo:** Sin CSRF, un atacante podría engañar a un admin autenticado para realizar acciones.
**Mitigación actual:** Uso de JWT Bearer en header Authorization (no cookie), lo que mitiga CSRF clásico.

### 3.3 Sanitización de inputs de búsqueda
**Acción:** Agregar `maxLength` a todos los inputs de búsqueda en el frontend para prevenir ataques de longitud.

### 3.4 Logging de eventos de seguridad
**Archivo:** `audit_log` table ya existe en BD.
**Pendiente:** Implementar logger que registre intentos de login fallidos, cambios de rol, anulaciones.

---

## 4. Archivos creados/modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/Dockerfile` | CSP + security headers en nginx |
| `frontend/src/pages/facturacion/InvoicesPage.tsx` | `escapeHtml()` para XSS |
| `backend/.../security/RateLimitingFilter.java` | **Nuevo** — Rate limiting login |
| `backend/.../security/jwt/JwtTokenProvider.java` | Validación longitud secret |
| `backend/.../config/SecurityConfig.java` | Headers de seguridad HTTP |
