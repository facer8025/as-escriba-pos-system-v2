#!/bin/bash
# ESCRIBA POS — Stress Test Data Ingest v3
DB="escriba_pos"
USER="escriba_user"
CID="550e8400-e29b-41d4-a716-446655440001"
PSQL="docker exec -i escriba-pos-db psql -U $USER -d $DB"

echo "=== ESCRIBA STRESS TEST DATA ==="

# 1. Company
$PSQL <<EOF
INSERT INTO companies (id, name, trade_name, nit, email, phone, address, primary_color, secondary_color, active)
SELECT '$CID', 'ESCRIBA STRESS TEST S.A.S.', 'ESCRIBA Stress', '901999999-1',
       'stress@escriba.co', '6010000000', 'Cra 100 # 100-100', '#131b2e', '#5c5e68', TRUE
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = '$CID');
EOF
echo "✓ Company"

# 2. Branches
for i in $(seq 1 5); do
  CODE=$(printf 'BR-%03d' $i)
  $PSQL -c "INSERT INTO branches (id, company_id, code, name, phone, address, active)
    SELECT gen_random_uuid(), '$CID', '$CODE', 'Sucursal Stress #$i', '6010000000', 'Cra Stress', TRUE
    WHERE NOT EXISTS (SELECT 1 FROM branches WHERE company_id='$CID' AND code='$CODE');"
done
echo "✓ Branches"
BID=$($PSQL -t -A -c "SELECT id FROM branches WHERE company_id='$CID' LIMIT 1;")

# 3. Users
for i in $(seq 1 20); do
  $PSQL -c "INSERT INTO users (id, branch_id, role_id, first_name, last_name, email, username, password_hash, phone, active)
    SELECT gen_random_uuid(), '$BID', 2, 'Usuario', 'Stress #$i', 'user$i@stress.com', 'user$i',
    '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '3000000000', TRUE
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='user$i@stress.com');"
done
echo "✓ Users"
USR=$($PSQL -t -A -c "SELECT id FROM users WHERE email='user1@stress.com' LIMIT 1;")

# 4. Categories
for i in $(seq 1 10); do
  COLORS=('#22c55e' '#3b82f6' '#f59e0b' '#ef4444' '#8b5cf6')
  C=${COLORS[$((i % 5))]}
  $PSQL -c "INSERT INTO categories (id, company_id, name, description, color, active)
    SELECT gen_random_uuid(), '$CID', 'Categoria Stress #$i', 'Categoria de prueba $i', '$C', TRUE
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE company_id='$CID' AND name='Categoria Stress #$i');"
done
echo "✓ Categories"

# 5. Products (10,000) - use batch offset via SQL
echo -n "✓ Products (10,000): "
OFFSET=0
for batch in $(seq 0 9); do
  $PSQL -c "INSERT INTO products (company_id, unit_id, internal_code, barcode, name, purchase_price, sale_price,
    vat_type, vat_rate, vat_included, manage_inventory, current_stock, stock_min, stock_max, avg_cost, status)
  SELECT '$CID', 1,
    'PROD-' || LPAD(($OFFSET + gs)::text, 6, '0'),
    LPAD(($OFFSET + gs)::text, 13, '0'),
    'Producto Stress #' || ($OFFSET + gs),
    round((random() * 50000 + 1000)::numeric, 2),
    round((random() * 80000 + 2000)::numeric, 2),
    CASE (gs % 4) WHEN 0 THEN 'STANDARD' WHEN 1 THEN 'STANDARD' WHEN 2 THEN 'REDUCED' ELSE 'EXCLUDED' END,
    CASE (gs % 4) WHEN 0 THEN 19 WHEN 1 THEN 19 WHEN 2 THEN 5 ELSE 0 END,
    TRUE, TRUE, floor(random() * 500)::numeric, 10, 500,
    round((random() * 30000 + 500 )::numeric, 2), 'ACTIVE'
  FROM generate_series(1, 1000) AS gs;" 2>/dev/null
  echo -n "."
  OFFSET=$((OFFSET + 1000))
done
echo ""

# 6. Customers (5,000)
echo -n "✓ Customers (5,000): "
OFFSET=0
for batch in $(seq 0 9); do
  $PSQL -c "INSERT INTO customers (company_id, name, document_number, phone, email, customer_type, active, total_purchases)
  SELECT '$CID',
    'Cliente Stress #' || ($OFFSET + gs),
    LPAD(($OFFSET + gs)::text, 10, '0'),
    '300' || LPAD(($OFFSET + gs)::text, 7, '0'),
    'cliente' || ($OFFSET + gs) || '@mail.com',
    CASE WHEN gs % 3 = 0 THEN 'WHOLESALE' ELSE 'RETAIL' END,
    TRUE, round((random() * 10000000)::numeric, 2)
  FROM generate_series(1, 500) AS gs;" 2>/dev/null
  echo -n "."
  OFFSET=$((OFFSET + 500))
done
echo ""

# 7. Sales (5,000)
echo -n "✓ Sales (5,000): "
OFFSET=0
for batch in $(seq 0 9); do
  $PSQL -c "INSERT INTO sales (company_id, branch_id, sale_number, seller_id,
    subtotal, discount_total, tax_total, total, status, document_type, created_at)
  SELECT '$CID', '$BID',
    'STRESS-' || LPAD(($OFFSET + gs)::text, 6, '0'), '$USR',
    round((random() * 500000 + 10000)::numeric, 2),
    round((random() * 50000)::numeric, 2),
    round((random() * 95000 + 1900)::numeric, 2),
    round((random() * 600000 + 10000)::numeric, 2),
    'COMPLETED',
    CASE WHEN gs % 5 = 0 THEN 'INVOICE' ELSE 'TICKET' END,
    CURRENT_TIMESTAMP - (random() * 90 || ' days')::interval
  FROM generate_series(1, 500) AS gs;" 2>/dev/null
  echo -n "."
  OFFSET=$((OFFSET + 500))
done
echo ""

# 8. Inventory movements (5,000)
echo -n "✓ Inventory movements: "
$PSQL -c "INSERT INTO inventory_movements (company_id, product_id, movement_type, reference_type,
    quantity, unit_cost, stock_before, stock_after, created_at)
  SELECT '$CID',
    (SELECT id FROM products WHERE company_id='$CID' ORDER BY random() LIMIT 1),
    'SALE', 'STRESS_TEST',
    floor(random() * -10 - 1)::numeric,
    round((random() * 30000)::numeric, 2),
    floor(random() * 500)::numeric,
    floor(random() * 490)::numeric,
    CURRENT_TIMESTAMP - (random() * 90 || ' days')::interval
  FROM generate_series(1, 5000) AS gs;" 2>/dev/null
echo ""

echo ""
echo "=== ROW COUNTS ==="
$PSQL -t -A -c "
SELECT 'Products' AS tbl, COUNT(*) FROM products WHERE company_id='$CID'
UNION ALL SELECT 'Customers', COUNT(*) FROM customers WHERE company_id='$CID'
UNION ALL SELECT 'Sales', COUNT(*) FROM sales WHERE company_id='$CID'
UNION ALL SELECT 'Inventory Movements', COUNT(*) FROM inventory_movements WHERE company_id='$CID'
UNION ALL SELECT 'Categories', COUNT(*) FROM categories WHERE company_id='$CID';"

echo ""
echo "=== DONE ==="
