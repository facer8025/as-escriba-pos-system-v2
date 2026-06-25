# ADR-0001: Stack Tecnológico

**Fecha:** 2026-06-21
**Estado:** Aceptado
**Contexto:** Decisión sobre el stack tecnológico para el sistema POS ESCRIBA.

## Decisión

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| Frontend | React + Vite | 19 / 6 | Ecosistema maduro, Vite es 10x más rápido que CRA |
| Backend | Spring Boot | 3.4 | Madurez empresarial, seguridad integrada, JPA |
| Lenguaje | Java | 21 | LTS, records, pattern matching, virtual threads |
| Base de datos | PostgreSQL | 16 | JSONB, arrays, rendimiento, madurez |
| Cache | Redis | 7 | Sesiones, caché de consultas frecuentes |
| Contenedores | Docker Compose | 3.9 | Estandar, reproducible, CI/CD ready |
| Auth | JWT (HS256) | — | Stateless, multi-tenant, refresh tokens |
| ORM | Hibernate + Flyway | 6.6 | Migraciones versionadas, validación de schema |

## Consecuencias

- **Positivas:** Stack probado, herramientas maduras, Java 21 es LTS hasta 2031
- **Negativas:** Spring Boot es pesado comparado con alternativas ligeras (Node, Go)
- **Riesgo:** Dependencia de Oracle/OpenJDK para updates de seguridad

## Alternativas consideradas

| Alternativa | Rechazada por |
|-------------|---------------|
| Node.js + Express | Sin tipado estático, menor ecosistema empresarial |
| Python + Django | Rendimiento inferior para POS en tiempo real |
| MySQL | Sin soporte nativo de JSONB ni arrays |
| Monolito PHP | Deuda técnica a largo plazo, difícil de escalar |
