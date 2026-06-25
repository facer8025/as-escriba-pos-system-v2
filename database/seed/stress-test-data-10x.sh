#!/bin/bash
# ESCRIBA POS — Stress Test Data Ingest v4 (10x data)
# Genera: 100K products, 50K customers, 50K sales, 50K movements
DB="escriba_pos"
USER="escriba_user"
CID="550e8400-e29b-41d4-a716-446655440001"
PSQL="docker exec -i escriba-pos-db psql -U $USER -d $DB"

echo "=== ESCRIBA STRESS TEST DATA v4 (10x) ==="

# 1. Company (skip if exists)
$PSQL <<EOF
INSERT INTO companies (id, name, trade_name, nit, email, phone, address, primary_color, secondary_color, active)
SELECT '$CID', 'ESCRIBA STRESS TEST 10X S.A.S.', 'ESCRIBA Stress 10x', '901999999-2',
       'stress10x@escriba.co', '6010000000', 'Cra 100 # 100-100', '#131b2e', '#5c5e68', TRUE
WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = '$CID');
EOF
echo "✓ Company"

# Branch
BID=$($PSQL -t -A -c "SELECT id FROM branches WHERE company_id='$CID' LIMIT 1;")
if [ -z "$BID" ]; then
  $PSQL -c "INSERT INTO branches (id, company_id, code, name, phone, address, active)
    VALUES (gen_random_uuid(), '$CID', 'BR-001', 'Sucursal Stress 10x', '6010000000', 'Cra Stress', TRUE);"
  BID=$($PSQL -t -A -c "SELECT id FROM branches WHERE company_id='$CID' LIMIT 1;")
fi
echo "✓ Branch: $BID"

# Users
USR=$($PSQL -t -A -c "SELECT id FROM users WHERE email='stress10x@escriba.co' LIMIT 1;")
if [ -z "$USR" ]; then
  $PSQL -c "INSERT INTO users (id, branch_id, role_id, first_name, last_name, email, username, password_hash, phone, active)
    VALUES (gen_random_uuid(), '$BID', 2, 'Admin', 'Stress 10x', 'stress10x@escriba.co', 'stress10x',
    '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '3000000000', TRUE);"
  USR=$($PSQL -t -A -c "SELECT id FROM users WHERE email='stress10x@escriba.co' LIMIT 1;")
fi
echo "✓ User: $USR"

# Categories (just 5)
$PSQL -c "INSERT INTO categories (id, company_id, name, description, color, active)
  SELECT gen_random_uuid(), '$CID', 'Cat 10x #' || gs, 'Category ' || gs,
  (ARRAY['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6'])[1 + (gs % 5)], TRUE
FROM generate_series(1,5) AS gs ON CONFLICT DO NOTHING;" 2>/dev/null
echo "✓ Categories"

echo ""
echo "--- INSERTING 100,000 PRODUCTS (100 batches of 1000) ---"
echo -n "Progress: "
START=$(date +%s)
for batch in $(seq 0 99); do
  $PSQL -c "INSERT INTO products (company_id, unit_id, internal_code, barcode, name, purchase_price, sale_price,
    vat_type, vat_rate, vat_included, manage_inventory, current_stock, stock_min, stock_max, avg_cost, status)
  SELECT '$CID', 1,
    'PROD-10X-' || LPAD(($batch * 1000 + gs)::text, 7, '0'),
    LPAD(($batch * 1000 + gs)::text, 13, '0'),
    'Producto 10x #' || ($batch * 1000 + gs),
    round((random() * 50000 + 1000)::numeric, 2),
    round((random() * 80000 + 2000)::numeric, 2),
    CASE (gs % 4) WHEN 0 THEN 'STANDARD' WHEN 1 THEN 'STANDARD' WHEN 2 THEN 'REDUCED' ELSE 'EXCLUDED' END,
    CASE (gs % 4) WHEN 0 THEN 19 WHEN 1 THEN 19 WHEN 2 THEN 5 ELSE 0 END,
    TRUE, TRUE, floor(random() * 500)::numeric, 10, 500,
    round((random() * 30000 + 500)::numeric, 2), 'ACTIVE'
  FROM generate_series(1, 1000) AS gs;" 2>/dev/null
  if [ $((batch % 10)) -eq 9 ]; then echo -n " $((batch + 1))%"; fi
  echo -n "."
done
echo ""
END=$(date +%s)
echo "   Products done in $((END - START))s"

# Count products
P_COUNT=$($PSQL -t -A -c "SELECT COUNT(*) FROM products WHERE company_id='$CID';")
echo "   Total products: $P_COUNT"

echo ""
echo "--- INSERTING 50,000 CUSTOMERS (50 batches of 1000) ---"
echo -n "Progress: "
START=$(date +%s)
for batch in $(seq 0 49); do
  $PSQL -c "INSERT INTO customers (company_id, name, document_number, phone, email, customer_type, active, total_purchases)
  SELECT '$CID',
    'Cliente 10x #' || ($batch * 1000 + gs),
    LPAD(($batch * 1000 + gs)::text, 10, '0'),
    '300' || LPAD(($batch * 1000 + gs)::text, 7, '0'),
    'cliente10x_' || ($batch * 1000 + gs) || '@mail.com',
    CASE WHEN gs % 3 = 0 THEN 'WHOLESALE' ELSE 'RETAIL' END,
    TRUE, round((random() * 10000000)::numeric, 2)
  FROM generate_series(1, 1000) AS gs;" 2>/dev/null
  if [ $((batch % 5)) -eq 4 ]; then echo -n " $(((batch + 1) * 2))%"; fi
  echo -n "."
done
echo ""
END=$(date +%s)
echo "   Customers done in $((END - START))s"

echo ""
echo "--- INSERTING 50,000 SALES (50 batches of 1000) ---"
echo -n "Progress: "
START=$(date +%s)
for batch in $(seq 0 49); do
  $PSQL -c "INSERT INTO sales (company_id, branch_id, sale_number, seller_id,
    subtotal, discount_total, tax_total, total, status, document_type, created_at)
  SELECT '$CID', '$BID',
    'STRESS-10X-' || LPAD(($batch * 1000 + gs)::text, 6, '0'), '$USR',
    round((random() * 500000 + 10000)::numeric, 2),
    round((random() * 50000)::numeric, 2),
    round((random() * 95000 + 1900)::numeric, 2),
    round((random() * 600000 + 10000)::numeric, 2),
    'COMPLETED',
    CASE WHEN gs % 5 = 0 THEN 'INVOICE' ELSE 'TICKET' END,
    CURRENT_TIMESTAMP - (random() * 90 || ' days')::interval
  FROM generate_series(1, 1000) AS gs;" 2>/dev/null
  if [ $((batch % 5)) -eq 4 ]; then echo -n " $(((batch + 1) * 2))%"; fi
  echo -n "."
done
echo ""
END=$(date +%s)
echo "   Sales done in $((END - START))s"

echo ""
echo "--- INSERTING 50,000 INVENTORY MOVEMENTS (10 batches of 5000) ---"
echo -n "Progress: "
START=$(date +%s)
for batch in $(seq 0 9); do
  $PSQL -c "INSERT INTO inventory_movements (company_id, product_id, movement_type, reference_type,
    quantity, unit_cost, stock_before, stock_after, created_at)
  SELECT '$CID',
    (SELECT id FROM products WHERE company_id='$CID' ORDER BY random() LIMIT 1),
    'SALE', 'STRESS_10X',
    floor(random() * -10 - 1)::numeric,
    round((random() * 30000)::numeric, 2),
    floor(random() * 500)::numeric,
    floor(random() * 490)::numeric,
    CURRENT_TIMESTAMP - (random() * 90 || ' days')::interval
  FROM generate_series(1, 5000) AS gs;" 2>/dev/null
  echo -n " $(((batch + 1) * 10))%"
done
echo ""
END=$(date +%s)
echo "   Movements done in $((END - START))s"

echo ""
echo "=== FINAL ROW COUNTS ==="
$PSQL -t -A -c "
SELECT 'Products' AS tbl, COUNT(*) FROM products WHERE company_id='$CID'
UNION ALL SELECT 'Customers', COUNT(*) FROM customers WHERE company_id='$CID'
UNION ALL SELECT 'Sales', COUNT(*) FROM sales WHERE company_id='$CID'
UNION ALL SELECT 'Inventory Movements', COUNT(*) FROM inventory_movements WHERE company_id='$CID'
UNION ALL SELECT 'Categories', COUNT(*) FROM categories WHERE company_id='$CID';"

echo ""
echo "=== DONE ==="
