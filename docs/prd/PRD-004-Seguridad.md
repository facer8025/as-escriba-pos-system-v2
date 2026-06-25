# PRD: ESCRIBA POS — Seguridad y Rendimiento

## Problem Statement
El sistema debe ser seguro contra ataques comunes (XSS, CSRF, fuerza bruta) y capaz de manejar grandes volúmenes de datos sin degradación del rendimiento.

## Solution
Implementación de headers de seguridad HTTP, rate limiting en login, sanitización de outputs, y optimización de consultas con índices de base de datos + paginación.

## User Stories
1. Como administrador, quiero que el sistema bloquee intentos de login masivos, para proteger contra fuerza bruta
2. Como desarrollador, quiero que el sistema tenga headers de seguridad, para prevenir XSS y clickjacking
3. Como usuario, quiero que las búsquedas y reportes sean rápidos aún con muchos datos, para no esperar

## Implementation Decisions
- Rate limiting: filtro Spring con ConcurrentHashMap (10 intentos/5min por IP)
- Headers de seguridad: CSP, HSTS, X-Frame-Options, X-Content-Type-Options en nginx + Spring
- XSS: función escapeHtml() en frontend para document.write()
- JWT: validación de clave ≥ 256 bits
- Índices BD: 11 índices nuevos (GIN trigram, compuestos, funcionales)
- Paginación en endpoints de listado (customers, products)
- Query única para reporte diario (reemplaza N+1 queries)

## Performance Targets
- Dashboard: < 200ms con 50K ventas ✅
- Productos paginados: < 500ms con 100K productos ✅
- Búsqueda productos: < 1s con índices trigram ✅ (estimado)
- Clientes paginados: < 200ms con 50K clientes ✅ (estimado)
- Reporte ventas 30d: < 500ms con 50K ventas ✅ (estimado)

## Out of Scope
- Migración de tokens a httpOnly cookies (requiere refactoring mayor)
- Rate limiting con Redis (dependencia adicional)
- WAF (Web Application Firewall) externo
