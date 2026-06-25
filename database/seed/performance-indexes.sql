-- ============================================================================
-- ESCRIBA POS — Performance Indexes
-- Creadas a partir de los resultados del stress test con 100K productos/50K ventas
-- ============================================================================

-- 1. Products: búsqueda full-text (más rápida que LIKE %...%)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_company_search
  ON products USING gin(to_tsvector('spanish', coalesce(name,'') || ' ' || coalesce(internal_code,'') || ' ' || coalesce(barcode,'')));

-- 2. Products: búsqueda por texto con LIKE (fallback)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_trgm
  ON products USING gin (lower(name) gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_code_trgm
  ON products USING gin (lower(internal_code) gin_trgm_ops);

-- 3. Sales: consultas por empresa + fecha + estado (dashboard, reportes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_company_date_status
  ON sales(company_id, created_at DESC, status);

-- 4. Sales: conteo por empresa + fecha (dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_company_created
  ON sales(company_id, created_at);

-- 5. Products: stock bajo y sin stock (alertas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_company_stock
  ON products(company_id, current_stock, stock_min)
  WHERE manage_inventory = true;

-- 6. Products: valor de inventario por empresa
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_company_inventory
  ON products(company_id, manage_inventory, current_stock, avg_cost);

-- 7. Customers: búsqueda por nombre (paginación)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_company_name
  ON customers(company_id, name);

-- 8. Customers: búsqueda por documento
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_company_doc
  ON customers(company_id, document_number);

-- 9. Inventory movements: consultas por producto
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_movements_product_date
  ON inventory_movements(product_id, created_at DESC);

-- 10. Notifications: no leídas por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read) WHERE is_read = false;
