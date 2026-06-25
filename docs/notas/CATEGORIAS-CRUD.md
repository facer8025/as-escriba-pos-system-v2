# Nota Técnica: CRUD de Categorías

**Fecha:** 2026-06-22
**Motivo:** Solicitud del usuario para agregar CRUD completo de categorías en el menú Catálogos.

## Cambios realizados

### Backend — `CategoryController.java`
Se agregaron endpoints completos de CRUD:

| Método | Ruta | Función | Seguridad |
|--------|------|---------|-----------|
| `GET` | `/categories` | Listar todas las categorías | Público |
| `GET` | `/categories/{id}` | Obtener una categoría | Público |
| `POST` | `/categories` | Crear nueva categoría | Solo ADMIN |
| `PUT` | `/categories/{id}` | Actualizar categoría | Solo ADMIN |
| `DELETE` | `/categories/{id}` | Eliminar categoría | Solo ADMIN |

**Validaciones:**
- El nombre es obligatorio
- No se puede eliminar una categoría con subcategorías
- La empresa (`company.id`) es obligatoria al crear

### Frontend — `CategoriesPage.tsx`
Interfaz dividida en dos paneles:

**Panel izquierdo — Árbol de categorías:**
- Visualización jerárquica con indentación
- Indicador de color circular junto a cada categoría
- Contador de subcategorías
- Botón "+" para agregar subcategoría directamente
- Botón "Nueva" para crear categoría raíz

**Panel derecho — Formulario CRUD:**
- Crear: nombre, descripción, color, categoría padre
- Editar: mismos campos precargados, permite cambiar padre
- Eliminar: modal de confirmación con alerta de irreversibilidad
- Selector de color: paleta de 20 colores + color picker libre
- Vista previa en vivo con badge de tipo (raíz/subcategoría)

### Seguridad
- Solo usuarios con rol `ADMIN` pueden crear, editar o eliminar
- La validación de permisos se hace vía `@PreAuthorize("hasRole('AD')")`

## Rutas
- `/productos/categorias` — Gestión visual desde el menú Productos
- También accesible desde `Configuración > Catálogos`

## Uso
```bash
# Crear categoría
curl -X POST http://localhost:8082/api/v1/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nueva Categoría","color":"#22c55e","active":true,"company":{"id":"<companyId>"}}'

# Actualizar
curl -X PUT http://localhost:8082/api/v1/categories/{id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Nombre Actualizado","color":"#3b82f6"}'

# Eliminar
curl -X DELETE http://localhost:8082/api/v1/categories/{id} \
  -H "Authorization: Bearer $TOKEN"
```
