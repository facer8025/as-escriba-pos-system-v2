-- ============================================================================
-- ESCRIBA POS — Stress Test Seed Data (fixed types)
-- ============================================================================

DO $$
DECLARE
    v_company_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    v_branch_id UUID;
    v_user_id UUID;
    v_cat_ids UUID[] := '{}';
    v_prod_ids UUID[] := '{}';
    v_cust_ids UUID[] := '{}';
    v_sale_ids UUID[] := '{}';
    v_id UUID;
    v_rec RECORD;
    v_start TIMESTAMP;
    v_rows INT;
BEGIN
    -- 1. Company (if not exists)
    INSERT INTO companies (id, name, trade_name, nit, email, phone, address, primary_color, secondary_color, active)
    SELECT v_company_id, 'ESCRIBA STRESS TEST S.A.S.', 'ESCRIBA Stress', '901999999-1',
           'stress@escriba.co', '6010000000', 'Cra 100 # 100-100', '#131b2e', '#5c5e68', TRUE
    WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = v_company_id);

    -- 2. Sucursales (5)
    FOR i IN 1..5 LOOP
        INSERT INTO branches (id, company_id, code, name, city, phone, address, active)
        VALUES (gen_random_uuid(), v_company_id,
                'BR-' || LPAD(i::text, 3, '0'),
                'Sucursal Stress #' || i,
                'Bogota', '6010000000', 'Cra Stress', TRUE)
        ON CONFLICT DO NOTHING;
    END LOOP;

    SELECT id INTO v_branch_id FROM branches WHERE company_id = v_company_id LIMIT 1;

    -- 3. Cajas
    FOR v_rec IN SELECT id FROM branches WHERE company_id = v_company_id LOOP
        FOR j IN 1..2 LOOP
            INSERT INTO cash_registers (id, branch_id, name, code, active)
            VALUES (gen_random_uuid(), v_rec.id, 'Caja BR-' || j, 'CAJ-' || j, TRUE)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- 4. Usuarios (20)
    FOR i IN 1..20 LOOP
        INSERT INTO users (id, branch_id, role_id, first_name, last_name, email, username, password_hash, phone, active)
        VALUES (gen_random_uuid(), v_branch_id, 2,
                'Usuario', 'Stress #' || i,
                'user' || i || '@stress.com',
                'user' || i,
                '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
                '3000000000', TRUE)
        ON CONFLICT DO NOTHING;
    END LOOP;

    SELECT id INTO v_user_id FROM users WHERE email = 'user1@stress.com' LIMIT 1;

    -- 5. Categorias (10)
    FOR i IN 1..10 LOOP
        INSERT INTO categories (id, company_id, name, description, color, active)
        VALUES (gen_random_uuid(), v_company_id,
                'Categoria Stress #' || i,
                'Categoria de prueba ' || i,
                CASE i % 5
                    WHEN 0 THEN '#22c55e' WHEN 1 THEN '#3b82f6'
                    WHEN 2 THEN '#f59e0b' WHEN 3 THEN '#ef4444' ELSE '#8b5cf6'
                END, TRUE)
        RETURNING id INTO v_id;
        v_cat_ids := array_append(v_cat_ids, v_id);
    END LOOP;

    -- 6. Productos (10,000) en batches de 500
    v_start := clock_timestamp();
    FOR batch IN 0..19 LOOP
        INSERT INTO products (id, company_id, category_id, internal_code, barcode, name,
            purchase_price, sale_price, vat_type, vat_rate, vat_included,
            manage_inventory, current_stock, stock_min, stock_max, avg_cost, status)
        SELECT
            gen_random_uuid(),
            v_company_id,
            v_cat_ids[1 + (gs % array_length(v_cat_ids, 1))],
            'PROD-' || LPAD((batch * 500 + gs)::text, 6, '0'),
            LPAD((batch * 500 + gs)::text, 13, '0'),
            'Producto Stress #' || (batch * 500 + gs),
            round((random() * 50000 + 1000)::numeric, 2),
            round((random() * 80000 + 2000)::numeric, 2),
            CASE (gs % 4) WHEN 0 THEN 'STANDARD' WHEN 1 THEN 'STANDARD'
                          WHEN 2 THEN 'REDUCED' ELSE 'EXCLUDED' END,
            CASE (gs % 4) WHEN 0 THEN 19 WHEN 1 THEN 19 WHEN 2 THEN 5 ELSE 0 END,
            TRUE, TRUE,
            floor(random() * 500)::numeric, 10, 500,
            round((random() * 30000 + 500)::numeric, 2), 'ACTIVE'
        FROM generate_series(1, 500) AS gs;
        COMMIT;
    END LOOP;
    RAISE NOTICE 'Productos insertados en %', clock_timestamp() - v_start;

    -- Collect product IDs (sample)
    SELECT ARRAY_AGG(id) INTO v_prod_ids
    FROM (SELECT id FROM products WHERE company_id = v_company_id LIMIT 1000) t;

    -- 7. Clientes (5,000) en batches
    v_start := clock_timestamp();
    FOR batch IN 0..9 LOOP
        INSERT INTO customers (id, company_id, name, document_number, phone, email, customer_type, active, total_purchases)
        SELECT
            gen_random_uuid(), v_company_id,
            'Cliente Stress #' || (batch * 500 + gs),
            LPAD((batch * 500 + gs)::text, 10, '0'),
            '300' || LPAD((batch * 500 + gs)::text, 7, '0'),
            'cliente' || (batch * 500 + gs) || '@mail.com',
            CASE WHEN gs % 3 = 0 THEN 'WHOLESALE' ELSE 'RETAIL' END,
            TRUE, round((random() * 10000000)::numeric, 2)
        FROM generate_series(1, 500) AS gs
        ON CONFLICT DO NOTHING;
        COMMIT;
    END LOOP;
    RAISE NOTICE 'Clientes insertados en %', clock_timestamp() - v_start;

    -- Collect customer IDs
    SELECT ARRAY_AGG(id) INTO v_cust_ids
    FROM (SELECT id FROM customers WHERE company_id = v_company_id LIMIT 1000) t;

    -- 8. Ventas (5,000) en batches
    v_start := clock_timestamp();
    FOR batch IN 0..9 LOOP
        FOR gs IN 1..500 LOOP
            INSERT INTO sales (id, company_id, branch_id, sale_number, customer_id, seller_id,
                subtotal, discount_total, tax_total, total, status, document_type, created_at)
            VALUES (
                gen_random_uuid(), v_company_id, v_branch_id,
                'STRESS-' || LPAD((batch * 500 + gs)::text, 6, '0'),
                CASE WHEN gs % 4 = 0 THEN NULL ELSE v_cust_ids[1 + (gs % array_length(v_cust_ids, 1))] END,
                v_user_id,
                round((random() * 500000 + 10000)::numeric, 2),
                round((random() * 50000)::numeric, 2),
                round((random() * 95000 + 1900)::numeric, 2),
                round((random() * 600000 + 10000)::numeric, 2),
                'COMPLETED',
                CASE WHEN gs % 5 = 0 THEN 'INVOICE' ELSE 'TICKET' END,
                CURRENT_TIMESTAMP - (random() * 90 || ' days')::interval
            );
        END LOOP;
        COMMIT;
        RAISE NOTICE 'Batch % ventas completo', batch + 1;
    END LOOP;
    RAISE NOTICE 'Ventas insertadas en %', clock_timestamp() - v_start;

    -- Collect sale IDs
    SELECT ARRAY_AGG(id) INTO v_sale_ids
    FROM (SELECT id FROM sales WHERE company_id = v_company_id LIMIT 1000) t;

    -- 9. Items de venta + pagos
    v_start := clock_timestamp();
    FOR i IN 1..least(array_length(v_sale_ids, 1), 1000) LOOP
        v_rows := 2 + floor(random() * 4)::int;
        FOR j IN 1..v_rows LOOP
            INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, tax_rate, tax_amount, subtotal, total)
            VALUES (
                gen_random_uuid(), v_sale_ids[i],
                v_prod_ids[1 + (floor(random() * array_length(v_prod_ids, 1)))::int],
                floor(random() * 10 + 1)::numeric,
                round((random() * 50000 + 5000)::numeric, 2),
                CASE floor(random() * 4)::int WHEN 0 THEN 19 WHEN 1 THEN 19 WHEN 2 THEN 5 ELSE 0 END,
                round((random() * 5000)::numeric, 2),
                round((random() * 100000)::numeric, 2),
                round((random() * 120000)::numeric, 2)
            );
        END LOOP;

        -- 1-2 pagos por venta
        FOR j IN 1..(1 + floor(random() * 2)::int) LOOP
            INSERT INTO sale_payments (id, sale_id, payment_method_id, amount)
            VALUES (gen_random_uuid(), v_sale_ids[i], 1 + floor(random() * 6)::int,
                    round((random() * 600000 + 10000)::numeric, 2));
        END LOOP;
    END LOOP;
    RAISE NOTICE 'Items y pagos insertados en %', clock_timestamp() - v_start;

    -- 10. Movimientos de inventario (5,000)
    v_start := clock_timestamp();
    FOR i IN 1..5000 LOOP
        INSERT INTO inventory_movements (id, company_id, product_id, movement_type, reference_type,
            quantity, unit_cost, stock_before, stock_after, created_at)
        VALUES (
            gen_random_uuid(), v_company_id,
            v_prod_ids[1 + (floor(random() * array_length(v_prod_ids, 1)))::int],
            'SALE', 'STRESS_TEST',
            floor(random() * -10 - 1)::numeric,
            round((random() * 30000)::numeric, 2),
            floor(random() * 500)::numeric,
            floor(random() * 490)::numeric,
            CURRENT_TIMESTAMP - (random() * 90 || ' days')::interval
        );
    END LOOP;
    RAISE NOTICE 'Movimientos insertados en %', clock_timestamp() - v_start;

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'STRESS TEST DATA GENERATION COMPLETE';
    RAISE NOTICE '==========================================';
END $$;
