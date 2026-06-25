-- ============================================================================
-- ESCRIBA POS - Demo Data Seed (V2)
-- Crea empresa demo, sucursal, y usuario administrador por defecto
-- ============================================================================
-- Credenciales por defecto:
--   Email: admin@escriba.co
--   Usuario: admin
--   Contraseña: Admin123!
-- ============================================================================

-- Insertar departamentos y ciudades de Colombia (muestra)
INSERT INTO departments (code, name) VALUES
('11', 'Bogotá D.C.'),
('25', 'Cundinamarca'),
('05', 'Antioquia'),
('76', 'Valle del Cauca')
ON CONFLICT (code) DO NOTHING;

INSERT INTO cities (department_id, code, name) 
SELECT d.id, '11001', 'Bogotá D.C.' FROM departments d WHERE d.code = '11'
UNION ALL
SELECT d.id, '25001', 'Bogotá' FROM departments d WHERE d.code = '25'
UNION ALL
SELECT d.id, '05001', 'Medellín' FROM departments d WHERE d.code = '05'
UNION ALL
SELECT d.id, '76001', 'Cali' FROM departments d WHERE d.code = '76'
ON CONFLICT (code) DO NOTHING;

-- Insertar bancos colombianos
INSERT INTO banks (code, name) VALUES
('001', 'Banco de la República'),
('007', 'Bancolombia'),
('051', 'Davivienda'),
('062', 'Banco de Bogotá'),
('065', 'BBVA Colombia'),
('072', 'Banco Popular'),
('084', 'Banco de Occidente'),
('106', 'Nequi'),
('155', 'Daviplata')
ON CONFLICT (code) DO NOTHING;

-- Crear empresa demo
INSERT INTO companies (
    id, name, trade_name, nit, dv, person_type, tax_regime,
    tax_responsibilities, ciiu_code, address,
    phone, email, primary_color, secondary_color, active
) VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'ESCRIBA DEMO S.A.S.',
    'ESCRIBA POS Demo',
    '901123456',
    '7',
    'LEGAL',
    'Responsable de IVA',
    ARRAY['O-13', 'O-15'],
    '4711',
    'Cra 7 # 71-21 Torre A, Oficina 1201',
    '6012345678',
    'demo@escriba.co',
    '#131b2e',
    '#5c5e68',
    true
);

-- Crear sucursal principal
WITH company AS (SELECT id FROM companies WHERE nit = '901123456')
INSERT INTO branches (id, company_id, code, name, address, phone, email, active)
SELECT 
    'b0000000-0000-0000-0000-000000000001'::uuid,
    company.id,
    'BCG-01',
    'Sucursal Principal - Bogotá',
    'Cra 7 # 71-21, Bogotá D.C.',
    '6012345678',
    'sucursal@escriba.co',
    true
FROM company;

-- Crear bodega principal
WITH branch AS (SELECT id FROM branches WHERE code = 'BCG-01')
INSERT INTO warehouses (id, branch_id, name, code, address, active)
SELECT 
    'c0000000-0000-0000-0000-000000000001'::uuid,
    branch.id,
    'Bodega Principal',
    'BOD-01',
    'Cra 7 # 71-21, Local 1',
    true
FROM branch;

-- Crear caja principal
WITH branch AS (SELECT id FROM branches WHERE code = 'BCG-01')
INSERT INTO cash_registers (id, branch_id, name, code, active)
SELECT 
    'd0000000-0000-0000-0000-000000000001'::uuid,
    branch.id,
    'Caja Principal',
    'CAJ-01',
    true
FROM branch;

-- Crear usuario administrador (contraseña: Admin123!)
-- Hash BCrypt generado con 10 rounds
INSERT INTO users (
    id, branch_id, role_id, first_name, last_name, email, username,
    password_hash, phone, active, must_change_password,
    failed_attempts, last_password_change
) VALUES (
    'e0000000-0000-0000-0000-000000000001'::uuid,
    'b0000000-0000-0000-0000-000000000001'::uuid,
    2,
    'Admin',
    'ESCRIBA',
    'admin@escriba.co',
    'admin',
    '$2a$10$IZjLlRNVVyzVRXhcxna8he28ctCTA.aKc.hVsc8Cm5n.qZDu43Aya',
    '3001234567',
    true,
    false,
    0,
    CURRENT_TIMESTAMP
);

-- Crear preferencias para el admin
INSERT INTO user_preferences (id, user_id, theme, language, sidebar_collapsed, items_per_page)
VALUES (
    'f0000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    'system',
    'es-CO',
    false,
    25
);

-- Crear categorías demo
INSERT INTO categories (id, parent_id, company_id, name, color, sort_order, active)
VALUES
    ('a1000000-0000-0000-0000-000000000001'::uuid, NULL, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Despensa', '#22c55e', 1, true),
    ('a1000000-0000-0000-0000-000000000002'::uuid, NULL, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Lácteos', '#3b82f6', 2, true),
    ('a1000000-0000-0000-0000-000000000003'::uuid, NULL, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Bebidas', '#f59e0b', 3, true),
    ('a1000000-0000-0000-0000-000000000004'::uuid, NULL, 'a0000000-0000-0000-0000-000000000001'::uuid, 'Aseo', '#8b5cf6', 4, true);

-- Crear marcas demo
INSERT INTO brands (name, description, active) VALUES
    ('Diana', 'Productos alimenticios Diana', true),
    ('Bimbo', 'Panadería Bimbo', true),
    ('Postobón', 'Bebidas Postobón', true),
    ('Colgate', 'Aseo personal Colgate', true),
    ('Nestlé', 'Alimentos Nestlé', true);

-- Crear productos demo (con stock inicial)
INSERT INTO products (
    id, company_id, category_id, warehouse_id, brand_id,
    internal_code, barcode, name, short_name, unit_id,
    status, purchase_price, sale_price, vat_type, vat_rate, vat_included,
    manage_inventory, current_stock, avg_cost, stock_min, stock_max, reorder_point
)
SELECT
    'b1000000-0000-0000-0000-000000000001'::uuid, c.id, cat.id, w.id, b.id,
    'PROD-001', '7701001012345', 'Arroz Diana x 500g', 'Arroz Diana', u.id,
    'ACTIVE', 1800, 2800, 'STANDARD', 19, true,
    true, 150, 1800, 20, 500, 30
FROM companies c, (SELECT id FROM categories WHERE name = 'Despensa') cat,
     (SELECT id FROM warehouses WHERE code = 'BOD-01') w,
     (SELECT id FROM brands WHERE name = 'Diana') b,
     (SELECT id FROM units WHERE code = 'UND') u
WHERE c.nit = '901123456'

UNION ALL
SELECT
    'b1000000-0000-0000-0000-000000000002'::uuid, c.id, cat.id, w.id, b.id,
    'PROD-002', '7701001012346', 'Aceite Vegetal x 900ml', 'Aceite Vegetal', u.id,
    'ACTIVE', 5500, 8500, 'STANDARD', 19, true,
    true, 80, 5500, 10, 200, 15
FROM companies c, (SELECT id FROM categories WHERE name = 'Despensa') cat,
     (SELECT id FROM warehouses WHERE code = 'BOD-01') w,
     (SELECT id FROM brands WHERE name = 'Diana') b,
     (SELECT id FROM units WHERE code = 'UND') u
WHERE c.nit = '901123456'

UNION ALL
SELECT
    'b1000000-0000-0000-0000-000000000003'::uuid, c.id, cat.id, w.id, b.id,
    'PROD-003', '7701001012347', 'Leche Entera x 1L', 'Leche Entera', u.id,
    'ACTIVE', 2800, 4200, 'EXEMPT', 0, true,
    true, 200, 2800, 30, 400, 40
FROM companies c, (SELECT id FROM categories WHERE name = 'Lácteos') cat,
     (SELECT id FROM warehouses WHERE code = 'BOD-01') w,
     (SELECT id FROM brands WHERE name = 'Nestlé') b,
     (SELECT id FROM units WHERE code = 'UND') u
WHERE c.nit = '901123456'

UNION ALL
SELECT
    'b1000000-0000-0000-0000-000000000004'::uuid, c.id, cat.id, w.id, b.id,
    'PROD-004', '7701001012348', 'Pan Bimbo x 500g', 'Pan Bimbo', u.id,
    'ACTIVE', 4200, 6500, 'EXEMPT', 0, true,
    true, 45, 4200, 10, 100, 15
FROM companies c, (SELECT id FROM categories WHERE name = 'Despensa') cat,
     (SELECT id FROM warehouses WHERE code = 'BOD-01') w,
     (SELECT id FROM brands WHERE name = 'Bimbo') b,
     (SELECT id FROM units WHERE code = 'UND') u
WHERE c.nit = '901123456'

UNION ALL
SELECT
    'b1000000-0000-0000-0000-000000000005'::uuid, c.id, cat.id, w.id, b.id,
    'PROD-005', '7701001012349', 'Gaseosa Coca-Cola x 2.5L', 'Coca-Cola 2.5L', u.id,
    'ACTIVE', 4500, 6800, 'STANDARD', 19, true,
    true, 120, 4500, 20, 300, 30
FROM companies c, (SELECT id FROM categories WHERE name = 'Bebidas') cat,
     (SELECT id FROM warehouses WHERE code = 'BOD-01') w,
     (SELECT id FROM brands WHERE name = 'Postobón') b,
     (SELECT id FROM units WHERE code = 'UND') u
WHERE c.nit = '901123456';

-- Crear movimientos de inventario iniciales
INSERT INTO inventory_movements (
    id, company_id, product_id, warehouse_id, movement_type,
    reference_type, quantity, unit_cost, stock_before, stock_after,
    created_by, created_at
)
SELECT
    gen_random_uuid(), c.id, p.id, w.id, 'INITIAL',
    'INITIAL', p.current_stock, p.avg_cost, 0, p.current_stock,
    u.id, CURRENT_TIMESTAMP
FROM companies c, products p,
     (SELECT id FROM warehouses WHERE code = 'BOD-01') w,
     (SELECT id FROM users WHERE email = 'admin@escriba.co') u
WHERE c.nit = '901123456' AND p.company_id = c.id;
