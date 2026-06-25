# ADR-0002: Arquitectura del Backend

**Fecha:** 2026-06-21
**Estado:** Aceptado
**Contexto:** Definir la estructura arquitectónica del backend Spring Boot.

## Decisión

Arquitectura por capas tradicional con separación clara:

```
Controller → Service → Repository → Entity
     ↓           ↓
   DTOs       Exceptions
```

Con los siguientes principios:
1. **Controllers delgados**: Solo reciben request, delegan a services
2. **Services con lógica de negocio**: Transaccionales, validaciones
3. **Repositories**: Solo acceso a datos, queries JPQL
4. **Entities anémicas**: Solo estado, getters/setters (Lombok)

## Consecuencias

- **Positivas:** Clara separación de concerns, fácil de testear
- **Positivas:** Familiar para cualquier desarrollador Spring
- **Negativas:** Puede generar mucho boilerplate para CRUDs simples
- **Mitigación:** MapStruct para DTOs, Lombok para entities
