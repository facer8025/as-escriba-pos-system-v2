-- ============================================================================
-- ESCRIBA POS v2 — Seed del panel administrativo (V6)
--
-- Población inicial de datos de prueba para el módulo Empresas:
--   * 4 planes de suscripción (Básico, Estándar, Profesional, Empresarial)
--   * 6 empresas de prueba (tenants) en distintos estados
--   * Licencias asociadas a cada empresa
--   * Módulos habilitados por tenant
--   * Facturas de muestra para empresas activas
--
-- Idempotente: usa ON CONFLICT DO NOTHING y UUIDs fijos.
-- ============================================================================

-- ============================================================================
-- 1. PLANES
-- ============================================================================
-- El plan "Básico" ya existe con id=100 (slug con tilde "básico").
-- Se normaliza su slug y se completan los datos faltantes.
UPDATE plans
SET slug = 'basico',
    description_short = 'Para negocios pequeños: 1 caja, inventario y facturación DIAN.',
    description_long = 'Plan de inicio para negocios de un solo punto de venta. Incluye POS, inventario, productos, proveedores, facturación electrónica DIAN y reportes básicos.',
    price_annual = 950000,
    tax_rate = 19,
    currency = 'COP',
    trial_days = 15,
    badge_color = '#4f46e5',
    is_featured = FALSE,
    is_visible_web = TRUE,
    status = 'ACTIVE',
    max_users = 2,
    max_branches = 1,
    max_products = 1000,
    max_monthly_invoices = 500,
    storage_gb = 10,
    support_level = 'EMAIL'
WHERE slug = 'básico' OR id = 100;

-- Módulos del plan Básico (los 3 existentes + el resto del core)
INSERT INTO plan_modules (plan_id, module_code, is_included, limit_value)
SELECT p.id, m.code, TRUE, NULL
FROM plans p, modules m
WHERE p.slug = 'basico'
  AND m.code IN ('SUPPLIERS', 'DIAN_BILLING', 'REPORTS_BASIC', 'DASHBOARD_BASIC')
ON CONFLICT (plan_id, module_code) DO NOTHING;

-- Planes adicionales
INSERT INTO plans (
    id, name, slug, description_short, description_long,
    price_monthly, price_annual, tax_rate, currency, trial_days,
    badge_color, is_featured, is_visible_web, status,
    max_users, max_branches, max_products, max_monthly_invoices,
    storage_gb, support_level
) VALUES
(101, 'Estándar', 'estandar',
 'Para negocios en crecimiento: multisucursal, contabilidad y CRM.',
 'Incluye todo el plan Básico más contabilidad, CRM, reportes avanzados y dashboard con análisis.',
 149000, 1590000, 19, 'COP', 15, '#0891b2', FALSE, TRUE, 'ACTIVE',
 5, 2, 5000, 2000, 50, 'EMAIL'),
(102, 'Profesional', 'profesional',
 'Para empresas consolidadas: e-commerce, app móvil y multisucursal.',
 'Incluye todo el plan Estándar más tienda virtual, app móvil básica y POS móvil.',
 249000, 2650000, 19, 'COP', 15, '#7c3aed', TRUE, TRUE, 'ACTIVE',
 15, 5, 20000, 10000, 200, 'PHONE'),
(103, 'Empresarial', 'empresarial',
 'Solución integral: IA, nómina electrónica, API pública y multisucursal ilimitada.',
 'Incluye todos los módulos de la plataforma: IA y predicción, RRHH, nómina electrónica DIAN, API pública y sucursales sin límite.',
 449000, 4790000, 19, 'COP', 15, '#dc2626', TRUE, TRUE, 'ACTIVE',
 NULL, NULL, 100000, NULL, 1024, 'DEDICATED')
ON CONFLICT (slug) DO NOTHING;

-- Módulos por plan (según categoría)
INSERT INTO plan_modules (plan_id, module_code, is_included, limit_value)
SELECT p.id, m.code, TRUE, NULL
FROM plans p, modules m
WHERE p.slug = 'estandar'
  AND m.code IN ('ACCOUNTING', 'CRM', 'REPORTS_ADV', 'DASHBOARD_AI')
ON CONFLICT (plan_id, module_code) DO NOTHING;

INSERT INTO plan_modules (plan_id, module_code, is_included, limit_value)
SELECT p.id, m.code, TRUE, NULL
FROM plans p, modules m
WHERE p.slug = 'profesional'
  AND m.code IN ('ACCOUNTING', 'CRM', 'REPORTS_ADV', 'DASHBOARD_AI',
                 'ECOMMERCE', 'MOBILE_BASIC', 'MOBILE_POS')
ON CONFLICT (plan_id, module_code) DO NOTHING;

INSERT INTO plan_modules (plan_id, module_code, is_included, limit_value)
SELECT p.id, m.code, TRUE, NULL
FROM plans p, modules m
WHERE p.slug = 'empresarial'
  AND m.code IN ('ACCOUNTING', 'CRM', 'REPORTS_ADV', 'DASHBOARD_AI',
                 'ECOMMERCE', 'MOBILE_BASIC', 'MOBILE_POS',
                 'AI_MODULE', 'HR_BASIC', 'PAYROLL', 'API_ACCESS', 'MULTI_BRANCH')
ON CONFLICT (plan_id, module_code) DO NOTHING;

-- Ajustar secuencia de planes
SELECT setval('plans_id_seq', (SELECT MAX(id) FROM plans), true);

-- ============================================================================
-- 2. EMPRESAS DE PRUEBA (TENANTS)
-- ============================================================================
INSERT INTO tenants (
    id, person_type, nit, dv, business_name, trade_name,
    tax_regime, ciiu_code, address, department, city, phone, email, website,
    status, suspension_reason, schema_name, subdomain, timezone,
    registered_at, activated_at, suspended_at, cancelled_at, notes
) VALUES
('10000000-0000-0000-0000-000000000001'::uuid, 'LEGAL', '900123456', '7',
 'Tecnología Andina S.A.S.', 'TecnoAndina',
 'Responsable de IVA', '6201', 'Cra 7 # 71-21 Torre A, Of. 1201', 'Bogotá D.C.', 'Bogotá',
 '6012345678', 'contacto@tecnoandina.co', 'https://tecnoandina.co',
 'ACTIVE', NULL, 'tenant_900123456', 'tecnoandina', 'America/Bogota',
 '2025-08-12T10:00:00Z', '2025-08-12T10:05:00Z', NULL, NULL,
 'Empresa demo de desarrollo de software'),

('20000000-0000-0000-0000-000000000002'::uuid, 'LEGAL', '830045678', '1',
 'Distribuidora La Victoria S.A.', 'La Victoria',
 'Responsable de IVA', '4711', 'Calle 45 # 52-15', 'Antioquia', 'Medellín',
 '6045112233', 'ventas@lavictoria.com.co', 'https://lavictoria.com.co',
 'ACTIVE', NULL, 'tenant_830045678', 'lavictoria', 'America/Bogota',
 '2025-09-03T15:30:00Z', '2025-09-03T15:40:00Z', NULL, NULL,
 'Empresa demo de distribución de alimentos'),

('30000000-0000-0000-0000-000000000003'::uuid, 'LEGAL', '901234567', '9',
 'Ferretería El Constructor S.A.S.', 'El Constructor',
 'Responsable de IVA', '4752', 'Av. 5N # 23-45', 'Valle del Cauca', 'Cali',
 '6023344556', 'ferreteria@elconstructor.co', NULL,
 'ACTIVE', NULL, 'tenant_901234567', 'elconstructor', 'America/Bogota',
 '2025-10-21T09:15:00Z', '2025-10-21T09:20:00Z', NULL, NULL,
 'Empresa demo de ferretería'),

('40000000-0000-0000-0000-000000000004'::uuid, 'LEGAL', '800123456', '4',
 'Restaurante La Abuela E.U.', 'La Abuela',
 'No responsable', '5611', 'Carrera 13 # 26-78', 'Bogotá D.C.', 'Bogotá',
 '6017890123', 'reservas@laabuela.co', NULL,
 'TRIAL', NULL, 'tenant_800123456', 'laabuela', 'America/Bogota',
 '2026-01-15T12:00:00Z', NULL, NULL, NULL,
 'Empresa demo en período de prueba'),

('50000000-0000-0000-0000-000000000005'::uuid, 'LEGAL', '860123456', '2',
 'Moda Urbana Ltda.', 'Moda Urbana',
 'Responsable de IVA', '4772', 'Calle 10 # 42-88', 'Antioquia', 'Medellín',
 '6045566778', 'info@modaurbana.com.co', 'https://modaurbana.com.co',
 'SUSPENDED', 'Mora en el pago de la factura FAC-2025-014', 'tenant_860123456', 'modaurbana', 'America/Bogota',
 '2025-07-05T14:00:00Z', '2025-07-05T14:10:00Z', '2026-01-28T10:00:00Z', NULL,
 'Empresa demo suspendida por cartera'),

('60000000-0000-0000-0000-000000000006'::uuid, 'LEGAL', '890345678', '5',
 'Transportes Rápidos del Valle S.A.', 'Rápidos del Valle',
 'Gran contribuyente', '4923', 'Calle 9 # 15-30', 'Valle del Cauca', 'Cali',
 '6028899001', 'operaciones@rapidosdelvalle.com', NULL,
 'CANCELLED', 'Cancelación solicitada por el cliente', 'tenant_890345678', 'rapidosdelvalle', 'America/Bogota',
 '2025-05-20T08:00:00Z', '2025-05-20T08:15:00Z', NULL, '2026-01-10T11:00:00Z',
 'Empresa demo cancelada')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. LICENCIAS
-- ============================================================================
INSERT INTO licenses (
    id, tenant_id, plan_id, license_type, status,
    starts_at, expires_at, auto_renew, grace_period_days,
    price_paid_monthly, discount_pct, discount_reason, notes, created_at
)
SELECT '10000000-0000-0000-0000-000000000001'::uuid, t.id, p.id, 'PAID', 'ACTIVE',
       '2025-08-12T10:05:00Z', '2026-08-12T10:05:00Z', TRUE, 7,
       p.price_monthly, 10, 'Descuento comercial por volumen', 'Licencia anual', CURRENT_TIMESTAMP
FROM tenants t, plans p
WHERE t.nit = '900123456' AND p.slug = 'profesional'
ON CONFLICT (id) DO NOTHING;

INSERT INTO licenses (
    id, tenant_id, plan_id, license_type, status,
    starts_at, expires_at, auto_renew, grace_period_days,
    price_paid_monthly, discount_pct, notes, created_at
)
SELECT '20000000-0000-0000-0000-000000000002'::uuid, t.id, p.id, 'PAID', 'ACTIVE',
       '2025-09-03T15:40:00Z', '2026-09-03T15:40:00Z', TRUE, 7,
       p.price_monthly, 0, NULL, CURRENT_TIMESTAMP
FROM tenants t, plans p
WHERE t.nit = '830045678' AND p.slug = 'estandar'
ON CONFLICT (id) DO NOTHING;

INSERT INTO licenses (
    id, tenant_id, plan_id, license_type, status,
    starts_at, expires_at, auto_renew, grace_period_days,
    price_paid_monthly, discount_pct, notes, created_at
)
SELECT '30000000-0000-0000-0000-000000000003'::uuid, t.id, p.id, 'PAID', 'ACTIVE',
       '2025-10-21T09:20:00Z', '2026-10-21T09:20:00Z', TRUE, 7,
       p.price_monthly, 0, NULL, CURRENT_TIMESTAMP
FROM tenants t, plans p
WHERE t.nit = '901234567' AND p.slug = 'basico'
ON CONFLICT (id) DO NOTHING;

INSERT INTO licenses (
    id, tenant_id, plan_id, license_type, status,
    starts_at, expires_at, auto_renew, grace_period_days,
    price_paid_monthly, discount_pct, notes, created_at
)
SELECT '40000000-0000-0000-0000-000000000004'::uuid, t.id, p.id, 'TRIAL', 'ACTIVE',
       '2026-01-15T12:00:00Z', '2026-02-15T12:00:00Z', FALSE, 7,
       0, 0, 'Trial de 30 días', CURRENT_TIMESTAMP
FROM tenants t, plans p
WHERE t.nit = '800123456' AND p.slug = 'basico'
ON CONFLICT (id) DO NOTHING;

INSERT INTO licenses (
    id, tenant_id, plan_id, license_type, status,
    starts_at, expires_at, auto_renew, grace_period_days,
    price_paid_monthly, discount_pct, notes, created_at
)
SELECT '50000000-0000-0000-0000-000000000005'::uuid, t.id, p.id, 'PAID', 'SUSPENDED',
       '2025-07-05T14:10:00Z', '2026-07-05T14:10:00Z', TRUE, 7,
       p.price_monthly, 0, 'Suspendida por mora', CURRENT_TIMESTAMP
FROM tenants t, plans p
WHERE t.nit = '860123456' AND p.slug = 'estandar'
ON CONFLICT (id) DO NOTHING;

INSERT INTO licenses (
    id, tenant_id, plan_id, license_type, status,
    starts_at, expires_at, auto_renew, grace_period_days,
    price_paid_monthly, discount_pct, notes, created_at
)
SELECT '60000000-0000-0000-0000-000000000006'::uuid, t.id, p.id, 'PAID', 'CANCELLED',
       '2025-05-20T08:15:00Z', '2026-05-20T08:15:00Z', FALSE, 7,
       p.price_monthly, 0, 'Cancelada por solicitud del cliente', CURRENT_TIMESTAMP
FROM tenants t, plans p
WHERE t.nit = '890345678' AND p.slug = 'profesional'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. MÓDULOS HABILITADOS POR TENANT
-- ============================================================================
INSERT INTO tenant_modules (id, tenant_id, module_code, is_enabled, is_trial, enabled_at, notes)
SELECT
    uuid_generate_v5(uuid_ns_url(), 'tnm-' || t.id || '-' || m.code),
    t.id, m.code, TRUE, FALSE, CURRENT_TIMESTAMP, 'Módulos del plan por defecto'
FROM tenants t, modules m
WHERE t.status = 'ACTIVE'
  AND m.is_core = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM tenant_modules tm WHERE tm.tenant_id = t.id AND tm.module_code = m.code
  );

-- Módulos adicionales para la empresa con plan Empresarial/Profesional demo
INSERT INTO tenant_modules (id, tenant_id, module_code, is_enabled, enabled_at, notes)
SELECT
    uuid_generate_v5(uuid_ns_url(), 'tnm-' || t.id || '-' || m.code),
    t.id, m.code, TRUE, CURRENT_TIMESTAMP, 'Módulo avanzado de prueba'
FROM tenants t, modules m
WHERE t.nit = '900123456'
  AND m.code IN ('ACCOUNTING', 'CRM', 'REPORTS_ADV', 'DASHBOARD_AI', 'ECOMMERCE')
  AND NOT EXISTS (
      SELECT 1 FROM tenant_modules tm WHERE tm.tenant_id = t.id AND tm.module_code = m.code
  );

-- ============================================================================
-- 5. FACTURAS DE MUESTRA (empresas activas)
-- ============================================================================
INSERT INTO tenant_invoices (
    id, tenant_id, license_id, invoice_number, invoice_type, concept, description,
    amount_net, tax_pct, tax_amount, total, currency, issued_at, due_date, paid_at,
    status, payment_method, payment_reference, notes
)
SELECT '10000000-0000-0000-0000-000000000101'::uuid, t.id, l.id, 'FAC-2025-014', 'RENEWAL',
       'Renovación anual plan Profesional', 'Licencia anual 2025-2026',
       2686500.00, 19, 510435.00, 3196935.00, 'COP',
       '2025-08-12T10:10:00Z', '2025-09-01', '2025-08-20T09:00:00Z',
       'PAID', 'TRANSFER', 'TRF-88231', NULL
FROM tenants t, licenses l
WHERE t.nit = '900123456' AND l.tenant_id = t.id AND l.status = 'ACTIVE'
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_invoices (
    id, tenant_id, license_id, invoice_number, invoice_type, concept, description,
    amount_net, tax_pct, tax_amount, total, currency, issued_at, due_date, paid_at,
    status, payment_method, payment_reference, notes
)
SELECT '20000000-0000-0000-0000-000000000202'::uuid, t.id, l.id, 'FAC-2025-027', 'RENEWAL',
       'Renovación trimestral plan Estándar', 'Cuota trimestral',
       447000.00, 19, 84930.00, 531930.00, 'COP',
       '2025-12-01T10:00:00Z', '2025-12-15', '2025-12-05T16:30:00Z',
       'PAID', 'CARD', 'AUTH-55102', NULL
FROM tenants t, licenses l
WHERE t.nit = '830045678' AND l.tenant_id = t.id AND l.status = 'ACTIVE'
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_invoices (
    id, tenant_id, license_id, invoice_number, invoice_type, concept, description,
    amount_net, tax_pct, tax_amount, total, currency, issued_at, due_date, paid_at,
    status, payment_method, payment_reference, notes
)
SELECT '30000000-0000-0000-0000-000000000303'::uuid, t.id, l.id, 'FAC-2026-003', 'RENEWAL',
       'Renovación mensual plan Básico', 'Cuota de enero 2026',
       89000.00, 19, 16910.00, 105910.00, 'COP',
       '2026-01-01T08:00:00Z', '2026-01-15', NULL,
       'PENDING', 'TRANSFER', NULL, 'Pendiente de pago'
FROM tenants t, licenses l
WHERE t.nit = '901234567' AND l.tenant_id = t.id AND l.status = 'ACTIVE'
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_invoices (
    id, tenant_id, license_id, invoice_number, invoice_type, concept, description,
    amount_net, tax_pct, tax_amount, total, currency, issued_at, due_date, paid_at,
    status, payment_method, payment_reference, notes
)
SELECT '50000000-0000-0000-0000-000000000505'::uuid, t.id, l.id, 'FAC-2025-031', 'RENEWAL',
       'Renovación anual plan Estándar', 'Factura asociada a la suspensión por mora',
       1590000.00, 19, 302100.00, 1892100.00, 'COP',
       '2026-01-10T09:00:00Z', '2026-01-25', NULL,
       'OVERDUE', 'TRANSFER', NULL, 'En mora — causa de suspensión'
FROM tenants t, licenses l
WHERE t.nit = '860123456' AND l.tenant_id = t.id AND l.status = 'SUSPENDED'
ON CONFLICT (id) DO NOTHING;
