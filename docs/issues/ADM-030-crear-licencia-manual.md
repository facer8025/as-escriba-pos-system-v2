# ADM-030: Modal Crear Licencia Manual

- **Épica:** EP-015 — Módulo Administrativo Global
- **Fase:** 2 — Core Business · **Sprint:** 4
- **Prioridad:** Alta
- **Estimado:** 1 día
- **Dependencias:** ADM-027 (Licencias API), ADM-028 (Lista licencias)

---

## Descripción

Implementar el modal de creación manual de licencias desde el listado de licencias. El modal permite seleccionar empresa, plan, tipo de licencia, duración, descuento y notificaciones, y envía los datos al endpoint `POST /admin/licenses`.

## Funcionalidad

- Botón "Nueva licencia" en la cabecera del listado
- Modal con formulario completo
- Selector de empresas (carga desde `GET /admin/tenants`)
- Selector de planes con precio (carga desde `GET /admin/plans`)
- Campos: tipo (Paga/Trial), duración (1m/3m/6m/1a/2a), renovación automática, días de gracia
- Sección de descuento: porcentaje + motivo
- Notas internas y opción de notificar a la empresa
- Validación: empresa y plan requeridos
- Submit vía `POST /admin/licenses`
- Refetch automático del listado tras creación exitosa

## Criterios de aceptación

- [x] Botón "Nueva licencia" abre modal
- [x] Selector de empresas carga desde API
- [x] Selector de planes carga desde API con precio
- [x] POST a `/admin/licenses` con datos del formulario
- [x] Validación de campos requeridos (empresa, plan)
- [x] Refetch de lista tras creación exitosa
- [x] Loader durante submit
- [x] Modal se cierra al cancelar o crear exitosamente
