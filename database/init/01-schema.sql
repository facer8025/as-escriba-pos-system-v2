-- ============================================================================
-- ESCRIBA POS - PostgreSQL Schema v2.0
-- Basado en la especificación funcional MVP (Módulos 1-10 + extensiones)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CATÁLOGOS BASE (Módulo 10.4)
-- ============================================================================

CREATE TABLE departments (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    department_id SMALLINT NOT NULL REFERENCES departments(id),
    code VARCHAR(5) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL
);
CREATE INDEX idx_cities_department ON cities(department_id);

CREATE TABLE banks (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE id_types (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    applies_to VARCHAR(20) NOT NULL DEFAULT 'ALL',
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO id_types (code, name, applies_to) VALUES
('CC', 'Cédula de Ciudadanía', 'PERSON'),
('CE', 'Cédula de Extranjería', 'PERSON'),
('TI', 'Tarjeta de Identidad', 'PERSON'),
('NIT', 'NIT', 'COMPANY'),
('PASSPORT', 'Pasaporte', 'PERSON'),
('RUT', 'RUT', 'COMPANY'),
('NIP', 'NIP (Extranjeros)', 'PERSON');

CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'QUANTITY',
    is_system BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE
);

INSERT INTO units (code, name, type, is_system) VALUES
('UND', 'Unidad', 'QUANTITY', TRUE),
('KG', 'Kilogramo', 'WEIGHT', TRUE),
('G', 'Gramo', 'WEIGHT', TRUE),
('L', 'Litro', 'VOLUME', TRUE),
('ML', 'Mililitro', 'VOLUME', TRUE),
('M', 'Metro', 'LENGTH', TRUE),
('CM', 'Centímetro', 'LENGTH', TRUE),
('CJA', 'Caja', 'QUANTITY', TRUE),
('PAQ', 'Paquete', 'QUANTITY', TRUE);

CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE
);
CREATE UNIQUE INDEX idx_brands_name ON brands(LOWER(name));

-- ============================================================================
-- EMPRESA Y SUCURSALES (Módulo 10.1 / 10.2)
-- ============================================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    nit VARCHAR(20) UNIQUE NOT NULL,
    dv VARCHAR(2),
    person_type VARCHAR(20) DEFAULT 'LEGAL',
    tax_regime VARCHAR(50),
    tax_responsibilities TEXT[],
    ciiu_code VARCHAR(10),
    address TEXT,
    department_id SMALLINT REFERENCES departments(id),
    city_id INT REFERENCES cities(id),
    postal_code VARCHAR(10),
    phone VARCHAR(30),
    cellphone VARCHAR(30),
    email VARCHAR(150),
    website VARCHAR(255),
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#131b2e',
    secondary_color VARCHAR(7) DEFAULT '#5c5e68',
    smtp_host VARCHAR(255),
    smtp_port INT,
    smtp_security VARCHAR(10),
    smtp_user VARCHAR(255),
    smtp_password TEXT,
    smtp_sender_name VARCHAR(100),
    smtp_sender_email VARCHAR(150),
    invoice_footer TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    department_id SMALLINT REFERENCES departments(id),
    city_id INT REFERENCES cities(id),
    phone VARCHAR(30),
    email VARCHAR(150),
    manager_id UUID,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, code)
);

-- ============================================================================
-- ROLES Y USUARIOS (Módulo 1)
-- ============================================================================

CREATE TABLE roles (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE
);

INSERT INTO roles (code, name, description, is_system) VALUES
('SA', 'Superadmin', 'Acceso total al sistema', TRUE),
('AD', 'Administrador', 'Gestión completa de la empresa', TRUE),
('CA', 'Cajero', 'Operación del POS y caja', TRUE),
('BO', 'Bodeguero', 'Gestión de inventario y bodegas', TRUE),
('VE', 'Vendedor', 'Ventas y atención al cliente', TRUE);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID REFERENCES branches(id),
    role_id SMALLINT NOT NULL REFERENCES roles(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash TEXT NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT TRUE,
    failed_attempts SMALLINT DEFAULT 0,
    locked_until TIMESTAMP,
    last_login TIMESTAMP,
    last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, email)
);

ALTER TABLE branches ADD CONSTRAINT fk_branches_manager
    FOREIGN KEY (manager_id) REFERENCES users(id);

CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(10) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'es-CO',
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    items_per_page INT DEFAULT 25,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);

-- ============================================================================
-- CATEGORÍAS Y PRODUCTOS (Módulo 2)
-- ============================================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#5c5e68',
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, parent_id, name)
);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_company ON categories(company_id);

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(10),
    address TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, name)
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    warehouse_id UUID REFERENCES warehouses(id),
    brand_id INT REFERENCES brands(id),
    internal_code VARCHAR(30),
    barcode VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(80),
    description TEXT,
    unit_id INT NOT NULL REFERENCES units(id),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    purchase_price NUMERIC(18,2) DEFAULT 0,
    sale_price NUMERIC(18,2) NOT NULL,
    wholesale_price NUMERIC(18,2),
    vat_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    vat_rate NUMERIC(5,2) DEFAULT 0,
    vat_included BOOLEAN DEFAULT TRUE,
    manage_inventory BOOLEAN DEFAULT TRUE,
    current_stock NUMERIC(18,3) DEFAULT 0,
    avg_cost NUMERIC(18,2) DEFAULT 0,
    stock_min NUMERIC(18,3) DEFAULT 0,
    stock_max NUMERIC(18,3) DEFAULT 0,
    reorder_point NUMERIC(18,3) DEFAULT 0,
    weight NUMERIC(10,3),
    expiration_control BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, internal_code),
    UNIQUE(company_id, barcode)
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_warehouse ON products(warehouse_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_code ON products(internal_code);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_company ON products(company_id);

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_prod_images_product ON product_images(product_id);

-- ============================================================================
-- PROVEEDORES (Módulo 7)
-- ============================================================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    person_type VARCHAR(10) DEFAULT 'LEGAL',
    document_type_id SMALLINT REFERENCES id_types(id),
    document_number VARCHAR(30) NOT NULL,
    dv VARCHAR(2),
    business_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    tax_regime VARCHAR(50),
    address TEXT,
    department_id SMALLINT REFERENCES departments(id),
    city_id INT REFERENCES cities(id),
    phone VARCHAR(30),
    cellphone VARCHAR(30),
    email VARCHAR(150),
    website VARCHAR(255),
    contact_name VARCHAR(150),
    contact_role VARCHAR(100),
    logo_url TEXT,
    payment_term VARCHAR(30) DEFAULT 'CASH',
    payment_term_days INT,
    currency VARCHAR(3) DEFAULT 'COP',
    default_discount NUMERIC(5,2) DEFAULT 0,
    early_payment_discount NUMERIC(5,2) DEFAULT 0,
    min_order_amount NUMERIC(18,2) DEFAULT 0,
    delivery_days INT DEFAULT 1,
    bank_id INT REFERENCES banks(id),
    bank_account_type VARCHAR(20),
    bank_account_number VARCHAR(50),
    rating SMALLINT,
    tags TEXT[],
    internal_notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, document_number)
);
CREATE INDEX idx_suppliers_company ON suppliers(company_id);
CREATE INDEX idx_suppliers_city ON suppliers(city_id);

CREATE TABLE supplier_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(150),
    is_primary BOOLEAN DEFAULT FALSE,
    has_whatsapp BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_supplier_contacts_supplier ON supplier_contacts(supplier_id);

-- ============================================================================
-- CLIENTES (Módulo 4)
-- ============================================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_type_id SMALLINT REFERENCES id_types(id),
    document_number VARCHAR(30) NOT NULL,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city_id INT REFERENCES cities(id),
    phone VARCHAR(30),
    email VARCHAR(150),
    customer_type VARCHAR(20) DEFAULT 'RETAIL',
    credit_limit NUMERIC(18,2) DEFAULT 0,
    payment_days INT DEFAULT 0,
    points_balance INT DEFAULT 0,
    total_purchases NUMERIC(18,2) DEFAULT 0,
    last_purchase_at TIMESTAMP,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, document_number)
);
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================================================
-- ÓRDENES DE COMPRA (Módulo 7.4 / 7.5)
-- ============================================================================

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    branch_id UUID REFERENCES branches(id),
    warehouse_id UUID REFERENCES warehouses(id),
    order_number VARCHAR(30) UNIQUE NOT NULL,
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_date DATE,
    currency VARCHAR(3) DEFAULT 'COP',
    exchange_rate NUMERIC(10,4) DEFAULT 1,
    reference_number VARCHAR(100),
    status VARCHAR(30) DEFAULT 'DRAFT',
    notes_supplier TEXT,
    notes_internal TEXT,
    subtotal NUMERIC(18,2) DEFAULT 0,
    discount_total NUMERIC(18,2) DEFAULT 0,
    tax_total NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) DEFAULT 0,
    sent_at TIMESTAMP,
    received_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_company ON purchase_orders(company_id);

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC(18,3) NOT NULL,
    quantity_received NUMERIC(18,3) DEFAULT 0,
    unit_cost NUMERIC(18,2) NOT NULL,
    discount_pct NUMERIC(5,2) DEFAULT 0,
    vat_rate NUMERIC(5,2) DEFAULT 0,
    subtotal NUMERIC(18,2) NOT NULL,
    tax_amount NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_po_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_product ON purchase_order_items(product_id);

-- ============================================================================
-- INVENTARIO (Módulo 3)
-- ============================================================================

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    movement_type VARCHAR(30) NOT NULL,
    reference_type VARCHAR(30),
    reference_id UUID,
    lot_number VARCHAR(100),
    expiration_date DATE,
    quantity NUMERIC(18,3) NOT NULL,
    unit_cost NUMERIC(18,2),
    stock_before NUMERIC(18,3),
    stock_after NUMERIC(18,3),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_inv_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inv_movements_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX idx_inv_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inv_movements_date ON inventory_movements(created_at);
CREATE INDEX idx_inv_movements_reference ON inventory_movements(reference_type, reference_id);
CREATE INDEX idx_inv_movements_company ON inventory_movements(company_id);

CREATE TABLE stock_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    count_name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES categories(id),
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    blind_count BOOLEAN DEFAULT FALSE,
    notes TEXT,
    total_products INT DEFAULT 0,
    total_counted INT DEFAULT 0,
    total_differences INT DEFAULT 0,
    created_by UUID REFERENCES users(id),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_stock_counts_warehouse ON stock_counts(warehouse_id);

CREATE TABLE stock_count_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_count_id UUID NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    system_stock NUMERIC(18,3) NOT NULL,
    counted_stock NUMERIC(18,3),
    difference NUMERIC(18,3),
    include_in_adjustment BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stock_count_id, product_id)
);
CREATE INDEX idx_stock_count_items_count ON stock_count_items(stock_count_id);

CREATE TABLE warehouse_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    transfer_number VARCHAR(30) UNIQUE NOT NULL,
    origin_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    destination_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    status VARCHAR(20) DEFAULT 'DRAFT',
    notes TEXT,
    total_items INT DEFAULT 0,
    created_by UUID REFERENCES users(id),
    received_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_transfers_origin ON warehouse_transfers(origin_warehouse_id);
CREATE INDEX idx_transfers_dest ON warehouse_transfers(destination_warehouse_id);

CREATE TABLE warehouse_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC(18,3) NOT NULL,
    quantity_received NUMERIC(18,3) DEFAULT 0,
    unit_cost NUMERIC(18,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_transfer_items_transfer ON warehouse_transfer_items(transfer_id);

-- ============================================================================
-- CAJA Y SESIONES (Módulo 4.1 / 4.6)
-- ============================================================================

CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10),
    printer_name VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, name)
);

CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_id UUID NOT NULL REFERENCES cash_registers(id),
    user_id UUID NOT NULL REFERENCES users(id),
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    opening_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    opening_denominations JSONB,
    closed_at TIMESTAMP,
    closing_amount NUMERIC(18,2),
    closing_denominations JSONB,
    counted_amount NUMERIC(18,2),
    difference_amount NUMERIC(18,2),
    cash_withdrawn NUMERIC(18,2) DEFAULT 0,
    base_for_next_session NUMERIC(18,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'OPEN',
    notes TEXT,
    total_sales INT DEFAULT 0,
    total_sales_amount NUMERIC(18,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_cash_sessions_register ON cash_sessions(register_id);
CREATE INDEX idx_cash_sessions_user ON cash_sessions(user_id);
CREATE INDEX idx_cash_sessions_status ON cash_sessions(status);

-- ============================================================================
-- MEDIOS DE PAGO (Módulo 6)
-- ============================================================================

CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    is_cash BOOLEAN DEFAULT FALSE,
    requires_reference BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO payment_methods (code, name, icon, is_cash, requires_reference, sort_order) VALUES
('CASH', 'Efectivo', 'payments', TRUE, FALSE, 1),
('DEBIT', 'Tarjeta Débito', 'credit_card', FALSE, TRUE, 2),
('CREDIT', 'Tarjeta Crédito', 'credit_card', FALSE, TRUE, 3),
('NEQUI', 'Nequi', 'nequi', FALSE, TRUE, 4),
('DAVIPLATA', 'Daviplata', 'daviplata', FALSE, TRUE, 5),
('TRANSFER', 'Transferencia Bancaria', 'account_balance', FALSE, TRUE, 6),
('CREDIT_ACCOUNT', 'A Crédito', 'credit_score', FALSE, FALSE, 7);

CREATE TABLE payment_method_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    payment_method_id INT NOT NULL REFERENCES payment_methods(id),
    enabled BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, payment_method_id)
);

-- ============================================================================
-- VENTAS (Módulo 4)
-- ============================================================================

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    branch_id UUID REFERENCES branches(id),
    sale_number VARCHAR(30) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    session_id UUID REFERENCES cash_sessions(id),
    seller_id UUID REFERENCES users(id),
    subtotal NUMERIC(18,2) NOT NULL,
    discount_type VARCHAR(10),
    discount_value NUMERIC(18,2) DEFAULT 0,
    discount_total NUMERIC(18,2) DEFAULT 0,
    tax_total NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    document_type VARCHAR(30) DEFAULT 'POS',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_session ON sales(session_id);
CREATE INDEX idx_sales_seller ON sales(seller_id);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_company ON sales(company_id);
CREATE INDEX idx_sales_number ON sales(sale_number);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC(18,3) NOT NULL,
    unit_price NUMERIC(18,2) NOT NULL,
    discount_type VARCHAR(10),
    discount_value NUMERIC(18,2) DEFAULT 0,
    discount_amount NUMERIC(18,2) DEFAULT 0,
    tax_rate NUMERIC(5,2) DEFAULT 0,
    tax_amount NUMERIC(18,2) DEFAULT 0,
    subtotal NUMERIC(18,2) NOT NULL,
    total NUMERIC(18,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

CREATE TABLE sale_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method_id INT NOT NULL REFERENCES payment_methods(id),
    reference VARCHAR(120),
    amount NUMERIC(18,2) NOT NULL,
    change_amount NUMERIC(18,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sale_payments_sale ON sale_payments(sale_id);

-- ============================================================================
-- DEVOLUCIONES (Módulo 4.7)
-- ============================================================================

CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    sale_id UUID NOT NULL REFERENCES sales(id),
    return_number VARCHAR(30) UNIQUE NOT NULL,
    reason VARCHAR(30) NOT NULL,
    reason_description TEXT,
    refund_type VARCHAR(30) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    tax_total NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_returns_sale ON returns(sale_id);
CREATE INDEX idx_returns_company ON returns(company_id);

CREATE TABLE return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
    sale_item_id UUID REFERENCES sale_items(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC(18,3) NOT NULL,
    unit_price NUMERIC(18,2) NOT NULL,
    subtotal NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_return_items_return ON return_items(return_id);

-- ============================================================================
-- FACTURACIÓN ELECTRÓNICA DIAN (Módulo 5)
-- ============================================================================

CREATE TABLE invoice_resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_type VARCHAR(30) NOT NULL,
    prefix VARCHAR(10),
    resolution_number VARCHAR(50) NOT NULL,
    resolution_date DATE NOT NULL,
    start_number INT NOT NULL,
    end_number INT NOT NULL,
    current_number INT NOT NULL,
    expiration_date DATE NOT NULL,
    technical_key TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, prefix, document_type)
);
CREATE INDEX idx_inv_resolutions_company ON invoice_resolutions(company_id);

CREATE TABLE electronic_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    sale_id UUID REFERENCES sales(id),
    return_id UUID REFERENCES returns(id),
    resolution_id UUID REFERENCES invoice_resolutions(id),
    document_number VARCHAR(50) NOT NULL,
    document_type VARCHAR(30) NOT NULL,
    cufe VARCHAR(255),
    qr_url TEXT,
    dian_status VARCHAR(30) DEFAULT 'PENDING',
    dian_message TEXT,
    dian_response JSONB,
    xml_url TEXT,
    pdf_url TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    send_attempts INT DEFAULT 0,
    last_send_attempt TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_elec_docs_sale ON electronic_documents(sale_id);
CREATE INDEX idx_elec_docs_status ON electronic_documents(dian_status);
CREATE INDEX idx_elec_docs_company ON electronic_documents(company_id);

-- ============================================================================
-- CONFIGURACIÓN DEL SISTEMA (Módulo 10)
-- ============================================================================

CREATE TABLE system_parameters (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    param_category VARCHAR(50) NOT NULL,
    param_key VARCHAR(50) NOT NULL,
    param_value TEXT NOT NULL,
    param_type VARCHAR(20) DEFAULT 'TEXT',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, param_key)
);

CREATE OR REPLACE FUNCTION create_default_parameters()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO system_parameters (company_id, param_category, param_key, param_value, param_type, description) VALUES
    (NEW.id, 'SECURITY', 'max_login_attempts', '5', 'NUMBER', 'Intentos de login antes de bloquear'),
    (NEW.id, 'SECURITY', 'block_duration_minutes', '30', 'NUMBER', 'Minutos de bloqueo tras intentos fallidos'),
    (NEW.id, 'SECURITY', 'session_timeout_minutes', '60', 'NUMBER', 'Minutos de inactividad para cerrar sesión'),
    (NEW.id, 'SECURITY', 'force_password_change_days', '0', 'NUMBER', 'Días para forzar cambio de contraseña'),
    (NEW.id, 'INVENTORY', 'stock_alert_days', '7', 'NUMBER', 'Días restantes para activar alerta de agotamiento'),
    (NEW.id, 'INVENTORY', 'costing_method', 'WEIGHTED_AVERAGE', 'SELECT', 'Método de costeo'),
    (NEW.id, 'INVENTORY', 'allow_negative_stock', 'false', 'BOOLEAN', 'Permitir ventas si no hay stock'),
    (NEW.id, 'SALES', 'cashier_max_discount_pct', '10', 'NUMBER', '% máximo de descuento para cajero'),
    (NEW.id, 'SALES', 'admin_max_discount_pct', '50', 'NUMBER', '% máximo de descuento para admin'),
    (NEW.id, 'SALES', 'require_customer_for_invoice', 'true', 'BOOLEAN', 'Exigir datos del cliente al generar factura'),
    (NEW.id, 'SALES', 'pos_auto_redirect_seconds', '15', 'NUMBER', 'Segundos para redirigir tras venta'),
    (NEW.id, 'TAX', 'default_vat_rate', '19', 'NUMBER', 'Tarifa IVA predeterminada'),
    (NEW.id, 'TAX', 'show_vat_on_ticket', 'true', 'BOOLEAN', 'Mostrar IVA desglosado en ticket'),
    (NEW.id, 'TAX', 'price_includes_vat', 'true', 'BOOLEAN', 'Precios incluyen IVA por defecto'),
    (NEW.id, 'GENERAL', 'currency', 'COP', 'SELECT', 'Moneda del sistema'),
    (NEW.id, 'GENERAL', 'date_format', 'DD/MM/YYYY', 'SELECT', 'Formato de fecha'),
    (NEW.id, 'GENERAL', 'timezone', 'America/Bogota', 'SELECT', 'Zona horaria');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_company_insert
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION create_default_parameters();

CREATE TABLE notification_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN DEFAULT FALSE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT FALSE,
    recipients TEXT[],
    digest_frequency VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, notification_type)
);

CREATE OR REPLACE FUNCTION create_default_notifications()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_config (company_id, notification_type, email_enabled, in_app_enabled) VALUES
    (NEW.id, 'STOCK_MIN_ALERT', TRUE, TRUE),
    (NEW.id, 'STOCK_OUT_ALERT', TRUE, TRUE),
    (NEW.id, 'DIAN_ERROR', TRUE, TRUE),
    (NEW.id, 'CASH_DIFFERENCE', TRUE, TRUE),
    (NEW.id, 'SALE_CANCELLED', FALSE, TRUE),
    (NEW.id, 'RESOLUTION_EXPIRING', TRUE, TRUE),
    (NEW.id, 'PO_RECEIVED', FALSE, TRUE),
    (NEW.id, 'NEW_USER_CREATED', TRUE, FALSE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_company_insert_notifications
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notifications();

-- ============================================================================
-- AUDITORÍA
-- ============================================================================

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_log_company ON audit_log(company_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_date ON audit_log(created_at);

-- ============================================================================
-- NOTIFICACIONES IN-APP
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    icon VARCHAR(50),
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_notifications_company ON notifications(company_id);

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
    p.id AS product_id, p.name AS product_name, p.internal_code, p.barcode,
    c.name AS category_name, w.name AS warehouse_name,
    p.current_stock, p.stock_min, p.stock_max, p.avg_cost,
    (p.current_stock * p.avg_cost) AS stock_value,
    CASE
        WHEN p.current_stock <= 0 THEN 'OUT_OF_STOCK'
        WHEN p.current_stock <= p.stock_min THEN 'LOW_STOCK'
        WHEN p.stock_max > 0 AND p.current_stock > p.stock_max THEN 'OVER_STOCK'
        ELSE 'NORMAL'
    END AS stock_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN warehouses w ON p.warehouse_id = w.id
WHERE p.manage_inventory = TRUE;

CREATE OR REPLACE VIEW v_daily_sales_summary AS
SELECT
    s.company_id, s.branch_id, s.seller_id,
    u.first_name || ' ' || u.last_name AS seller_name,
    DATE(s.created_at) AS sale_date,
    COUNT(*) AS total_sales,
    SUM(s.total) AS total_amount, SUM(s.tax_total) AS total_tax,
    AVG(s.total) AS avg_ticket, SUM(s.discount_total) AS total_discounts
FROM sales s
JOIN users u ON s.seller_id = u.id
WHERE s.status = 'COMPLETED'
GROUP BY s.company_id, s.branch_id, s.seller_id, u.first_name, u.last_name, DATE(s.created_at);

-- Índices adicionales para rendimiento
CREATE INDEX IF NOT EXISTS idx_products_company_stock ON products(company_id, current_stock);
CREATE INDEX IF NOT EXISTS idx_sales_company_date ON sales(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_returns_company_date ON returns(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_electronic_docs_cufe ON electronic_documents(cufe);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_date ON inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_audit_log_date_desc ON audit_log(created_at DESC);
