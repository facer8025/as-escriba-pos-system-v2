# IS-008: Gestión de Usuarios — CRUD Completo

- **Épica:** EP-004
- **Prioridad:** Alta
- **Estimado:** 1 día
- **Dependencias:** Backend endpoints existentes

## Descripción

Implementar el CRUD completo de usuarios en la página **Configuración > Usuarios** (`/configuracion/usuarios`). El botón "Nuevo usuario" actualmente no tenía funcionalidad. Se implementa:

- Modal de creación con formulario
- Edición inline en modal
- Toggle de estado activo/inactivo
- Eliminación con confirmación
- Filtros por nombre/correo y rol

## Criterios de aceptación

- [x] Botón "Nuevo usuario" abre modal con formulario
- [x] Campos: Nombres, Apellidos, Correo, Teléfono, Contraseña, Rol
- [x] Validación: campos obligatorios (nombres, apellidos, correo, contraseña en creación)
- [x] Creación vía `POST /auth/register`
- [x] Edición vía `PUT /users/{id}` (contraseña opcional en edición)
- [x] Toggle activo/inactivo funcional vía `PATCH /users/{id}/toggle-status`
- [x] Eliminación con confirmación `confirm()` vía `DELETE /users/{id}`
- [x] Iconos de editar (lápiz) y eliminar (papelera) visibles al hacer hover
- [x] Filtro por búsqueda de texto (nombre o correo)
- [x] Filtro por rol (desplegable)
- [x] Refetch automático tras crear/editar/toggle/eliminar (TanStack Query cache invalidation)
- [x] Toast de éxito/error en cada operación

## API Contracts

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| `GET` | `/users?companyId=X` | Listar usuarios |
| `POST` | `/auth/register` | Crear usuario |
| `PUT` | `/users/{id}` | Actualizar usuario |
| `PATCH` | `/users/{id}/toggle-status` | Cambiar estado |
| `DELETE` | `/users/{id}` | Eliminar usuario |

## Formulario

### Creación
```
┌─────────────────────────────────────┐
│  👤 Nuevo usuario                   │
│  Ingresa los datos del nuevo usuario│
├─────────────────────────────────────┤
│  Nombres *     │  Apellidos *       │
│  (input)       │  (input)           │
├─────────────────────────────────────┤
│  ✉ Correo electrónico *             │
│  (input email)                      │
├─────────────────────────────────────┤
│  📞 Teléfono                        │
│  (input text)                       │
├─────────────────────────────────────┤
│  🔒 Contraseña *                    │
│  (input password, min 8 chars)      │
├─────────────────────────────────────┤
│  Rol *                              │
│  (select: AD/CA/BO/VE)             │
├─────────────────────────────────────┤
│           [Cancelar] [Crear usuario]│
└─────────────────────────────────────┘
```

### Edición
Igual que creación pero:
- Título: "Editar usuario"
- Contraseña: opcional (texto: "dejar vacío para mantener")
- Botón: "Guardar cambios"

## Archivos modificados

- `frontend/src/pages/configuracion/UsersPage.tsx` — Implementación completa del CRUD

## Archivos de documentación actualizados

- `docs/issues/IS-008-gestion-usuarios.md` — Este documento
- `docs/reports/STATUS.md` — Módulo 1 actualizado
- `docs/backlog/MASTER.md` — EP-004 ampliada
