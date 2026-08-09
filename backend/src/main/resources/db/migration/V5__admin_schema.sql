-- ============================================================================
-- ESCRIBA POS v2 — Admin / SuperAdmin Schema (V6)
-- Schema: public (datos de gestión global del panel administrativo)
--
-- Esta migración ejecuta el mismo DDL que database/init/02-admin-schema.sql
-- pero con CREATE IF NOT EXISTS para ser idempotente cuando el init script
-- ya haya creado las tablas al iniciar el contenedor PostgreSQL.
-- ============================================================================

-- ============================================================================
-- 1. ADMIN ROLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_roles (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(5) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admin_roles (code, name, description) VALUES
('SA', 'Super Admin', 'Acceso completo a todos los módulos. Crea otros Super Admins.'),
('AC', 'Admin Comercial', 'Gestiona empresas, planes, licencias y comunicaciones.'),
('AF', 'Admin Financiero', 'Gestiona facturación, cobros y reportes financieros.'),
('ST', 'Soporte Técnico', 'Accede a empresas (solo lectura), tickets de soporte y monitoreo.'),
('AU', 'Auditor', 'Solo lectura total. Accede a todos los módulos en modo consulta.')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. ADMIN USERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id SMALLINT NOT NULL REFERENCES admin_roles(id),
    password_hash TEXT NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    position VARCHAR(100),
    totp_secret TEXT,
    totp_enabled BOOLEAN DEFAULT FALSE,
    ip_whitelist TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    failed_attempts SMALLINT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- ============================================================================
-- 3. ADMIN REFRESH TOKENS
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_refresh_tokens_user ON admin_refresh_tokens(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_refresh_tokens_hash ON admin_refresh_tokens(token_hash);

-- ============================================================================
-- 4. TENANTS (EMPRESAS CLIENTES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_type VARCHAR(10) DEFAULT 'LEGAL',
    nit VARCHAR(20) UNIQUE NOT NULL,
    dv VARCHAR(2),
    business_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    tax_regime VARCHAR(50),
    tax_responsibilities TEXT[],
    ciiu_code VARCHAR(10),
    address TEXT,
    department VARCHAR(100),
    city VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(150) UNIQUE NOT NULL,
    website VARCHAR(255),
    logo_url TEXT,
    status VARCHAR(20) DEFAULT 'TRIAL',
    suspension_reason TEXT,
    schema_name VARCHAR(100) UNIQUE NOT NULL,
    subdomain VARCHAR(100) UNIQUE,
    timezone VARCHAR(50) DEFAULT 'America/Bogota',
    registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_by UUID REFERENCES admin_users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_city ON tenants(city);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_schema ON tenants(schema_name);

-- ============================================================================
-- 5. MODULES (CATÁLOGO DE MÓDULOS FUNCIONALES)
-- ============================================================================
CREATE TABLE IF NOT EXISTS modules (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL,
    is_core BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO modules (code, name, description, category, is_core, sort_order) VALUES
('POS_BASIC', 'POS básico', 'Punto de venta, caja, tickets', 'CORE', TRUE, 1),
('INVENTORY', 'Inventario', 'Kardex, entradas, salidas', 'CORE', TRUE, 2),
('PRODUCTS', 'Productos', 'Catálogo completo de productos', 'CORE', TRUE, 3),
('SUPPLIERS', 'Proveedores', 'Directorio de proveedores y órdenes', 'CORE', TRUE, 4),
('DIAN_BILLING', 'Facturación DIAN', 'Factura electrónica colombiana', 'CORE', TRUE, 5),
('REPORTS_BASIC', 'Reportes básicos', '5 reportes esenciales', 'CORE', TRUE, 6),
('DASHBOARD_BASIC', 'Dashboard básico', '6 widgets del panel principal', 'CORE', TRUE, 7),
('ACCOUNTING', 'Contabilidad', 'CxC, CxP, cierre contable', 'ADVANCED', FALSE, 8),
('CRM', 'CRM', 'Clientes y fidelización', 'ADVANCED', FALSE, 9),
('REPORTS_ADV', 'Reportes avanzados', 'Todos los reportes + exportación', 'ADVANCED', FALSE, 10),
('DASHBOARD_AI', 'Dashboard IA', 'Widgets con predicción', 'ADVANCED', FALSE, 11),
('ECOMMERCE', 'Tienda virtual', 'Canal de ventas online', 'PREMIUM', FALSE, 12),
('MOBILE_BASIC', 'App móvil básica', 'Consultas desde app móvil', 'PREMIUM', FALSE, 13),
('MOBILE_POS', 'App móvil POS', 'POS desde dispositivo móvil', 'PREMIUM', FALSE, 14),
('AI_MODULE', 'IA y predicción', 'Predicción de stock, análisis inteligente', 'PREMIUM', FALSE, 15),
('HR_BASIC', 'RRHH básico', 'Empleados, asistencia', 'PREMIUM', FALSE, 16),
('PAYROLL', 'Nómina electrónica', 'Nómina electrónica DIAN', 'PREMIUM', FALSE, 17),
('API_ACCESS', 'API pública', 'API para integraciones externas', 'PREMIUM', FALSE, 18),
('MULTI_BRANCH', 'Multisucursal', 'Sin límite de sucursales', 'PREMIUM', FALSE, 19)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 6. PLANS (PLANES DE SUSCRIPCIÓN)
-- ============================================================================
CREATE TABLE IF NOT EXISTS plans (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description_short VARCHAR(200),
    description_long TEXT,
    price_monthly NUMERIC(18,2) NOT NULL DEFAULT 0,
    price_annual NUMERIC(18,2) NOT NULL DEFAULT 0,
    annual_discount_pct NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN price_monthly > 0
        THEN ROUND(((price_monthly * 12 - price_annual) / (price_monthly * 12)) * 100, 2)
        ELSE 0 END
    ) STORED,
    tax_rate NUMERIC(5,2) DEFAULT 19,
    currency VARCHAR(3) DEFAULT 'COP',
    trial_days INT DEFAULT 0,
    badge_color VARCHAR(7) DEFAULT '#4f46e5',
    is_featured BOOLEAN DEFAULT FALSE,
    is_visible_web BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    max_users INT,
    max_branches INT,
    max_products INT,
    max_monthly_invoices INT,
    storage_gb INT,
    support_level VARCHAR(30),
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);

-- ============================================================================
-- 7. PLAN_MODULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS plan_modules (
    id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    module_code VARCHAR(30) NOT NULL REFERENCES modules(code),
    is_included BOOLEAN DEFAULT TRUE,
    limit_value INT,
    UNIQUE(plan_id, module_code)
);

CREATE INDEX IF NOT EXISTS idx_plan_modules_plan ON plan_modules(plan_id);

-- ============================================================================
-- 8. LICENSES
-- ============================================================================
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    plan_id INT NOT NULL REFERENCES plans(id),
    license_type VARCHAR(10) NOT NULL DEFAULT 'PAID',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    grace_period_days INT DEFAULT 7,
    price_paid_monthly NUMERIC(18,2),
    discount_pct NUMERIC(5,2) DEFAULT 0,
    discount_reason TEXT,
    notes TEXT,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_licenses_tenant ON licenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_licenses_plan ON licenses(plan_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires ON licenses(expires_at);

-- ============================================================================
-- 9. LICENSE_HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS license_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
    change_type VARCHAR(30) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    notes TEXT,
    changed_by UUID REFERENCES admin_users(id),
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_license_history_license ON license_history(license_id);

-- ============================================================================
-- 10. TENANT_MODULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    module_code VARCHAR(30) NOT NULL REFERENCES modules(code),
    is_enabled BOOLEAN DEFAULT FALSE,
    is_trial BOOLEAN DEFAULT FALSE,
    trial_expires_at TIMESTAMPTZ,
    enabled_at TIMESTAMPTZ,
    enabled_by UUID REFERENCES admin_users(id),
    notes TEXT,
    UNIQUE(tenant_id, module_code)
);

CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON tenant_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_code ON tenant_modules(module_code);

-- ============================================================================
-- 11. FEATURE_FLAGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    default_state VARCHAR(20) DEFAULT 'INACTIVE',
    rollout_pct NUMERIC(5,2),
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    flag_code VARCHAR(50) NOT NULL REFERENCES feature_flags(code),
    is_enabled BOOLEAN DEFAULT TRUE,
    enabled_by UUID REFERENCES admin_users(id),
    enabled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, flag_code)
);

CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_tenant ON tenant_feature_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_flags_flag ON tenant_feature_flags(flag_code);

-- ============================================================================
-- 12. TENANT_INVOICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    license_id UUID REFERENCES licenses(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_type VARCHAR(30) DEFAULT 'MANUAL',
    concept VARCHAR(200) NOT NULL,
    description TEXT,
    amount_net NUMERIC(18,2) NOT NULL,
    tax_pct NUMERIC(5,2) DEFAULT 19,
    tax_amount NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'COP',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'PENDING',
    payment_method VARCHAR(30),
    payment_reference VARCHAR(100),
    notes TEXT,
    pdf_url TEXT,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_invoices_tenant ON tenant_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invoices_status ON tenant_invoices(status);
CREATE INDEX IF NOT EXISTS idx_tenant_invoices_due ON tenant_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_tenant_invoices_issued ON tenant_invoices(issued_at);

-- ============================================================================
-- 13. SUPPORT_TICKETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    subject VARCHAR(200) NOT NULL,
    category VARCHAR(30) NOT NULL,
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    assigned_to UUID REFERENCES admin_users(id),
    sla_deadline TIMESTAMPTZ,
    sla_breached BOOLEAN DEFAULT FALSE,
    created_by_type VARCHAR(10) NOT NULL,
    created_by_id UUID NOT NULL,
    closed_at TIMESTAMPTZ,
    resolution_summary TEXT,
    root_cause VARCHAR(30),
    satisfaction_score SMALLINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_sla ON support_tickets(sla_deadline);

-- ============================================================================
-- 14. TICKET_MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL,
    sender_id UUID NOT NULL,
    body TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT FALSE,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);

-- ============================================================================
-- 15. ANNOUNCEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    type VARCHAR(30) NOT NULL,
    body_html TEXT NOT NULL,
    header_image_url TEXT,
    target_criteria JSONB,
    channels JSONB NOT NULL,
    banner_duration_days INT DEFAULT 7,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'DRAFT',
    total_recipients INT DEFAULT 0,
    open_rate NUMERIC(5,2),
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_scheduled ON announcements(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);

-- ============================================================================
-- 16. ANNOUNCEMENT_DELIVERIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcement_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    error_message TEXT,
    UNIQUE(announcement_id, tenant_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_announcement_deliveries_announcement ON announcement_deliveries(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_deliveries_tenant ON announcement_deliveries(tenant_id);

-- ============================================================================
-- 17. MAINTENANCE_WINDOWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS maintenance_windows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    starts_at TIMESTAMPTZ NOT NULL,
    estimated_duration_min INT NOT NULL,
    scope VARCHAR(30) NOT NULL,
    description TEXT NOT NULL,
    notify_hours_before INT DEFAULT 4,
    banner_from_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    created_by UUID REFERENCES admin_users(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 18. SERVICE_HEALTH_LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_health_logs (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) NOT NULL,
    response_time_ms INT,
    error_message TEXT,
    details JSONB
);

CREATE INDEX IF NOT EXISTS idx_service_health_logs_service ON service_health_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_service_health_logs_checked ON service_health_logs(checked_at DESC);

-- ============================================================================
-- 19. ADMIN_AUDIT_LOGS (append-only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    admin_user_id UUID REFERENCES admin_users(id),
    admin_email VARCHAR(150),
    admin_role VARCHAR(5),
    category VARCHAR(30) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    target_tenant_id UUID REFERENCES tenants(id),
    module VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    data_before JSONB,
    data_after JSONB,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    result VARCHAR(10) NOT NULL DEFAULT 'SUCCESS'
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_timestamp ON admin_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_category ON admin_audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_tenant ON admin_audit_logs(target_tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_module ON admin_audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_result ON admin_audit_logs(result);

-- ============================================================================
-- 20. SECURITY_ALERTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_code VARCHAR(50) NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    admin_user_id UUID REFERENCES admin_users(id),
    tenant_id UUID REFERENCES tenants(id),
    description TEXT NOT NULL,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'NEW',
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_triggered ON security_alerts(triggered_at DESC);

-- ============================================================================
-- 21. SYSTEM_CONFIG
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) DEFAULT 'TEXT',
    description TEXT,
    updated_by UUID REFERENCES admin_users(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('maintenance_mode', 'false', 'BOOLEAN', 'Activar modo mantenimiento del panel admin'),
('maintenance_message', '', 'TEXT', 'Mensaje visible durante el mantenimiento'),
('default_grace_period_days', '7', 'NUMBER', 'Días de gracia por defecto al vencer licencia'),
('default_trial_duration_days', '15', 'NUMBER', 'Duración del trial por defecto'),
('client_portal_url', 'https://app.escriba.co', 'TEXT', 'URL del panel de empresas'),
('support_portal_url', 'https://soporte.escriba.co', 'TEXT', 'URL del portal de soporte'),
('support_email', 'soporte@escriba.co', 'TEXT', 'Email de soporte visible para clientes'),
('audit_log_retention_days', '365', 'NUMBER', 'Días de retención de logs de auditoría'),
('work_hours_start', '08:00', 'TEXT', 'Inicio de jornada laboral'),
('work_hours_end', '18:00', 'TEXT', 'Fin de jornada laboral'),
('admin_password_min_length', '12', 'NUMBER', 'Longitud mínima de contraseñas admin'),
('tenant_password_min_length', '8', 'NUMBER', 'Longitud mínima de contraseñas de tenants'),
('admin_jwt_duration_minutes', '240', 'NUMBER', 'Duración máxima del JWT del panel admin'),
('tenant_jwt_duration_minutes', '60', 'NUMBER', 'Duración máxima del JWT de empresas')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================================
-- 22. DIAN_PROVIDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS dian_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    api_base_url VARCHAR(255) NOT NULL,
    sandbox_url VARCHAR(255),
    documentation_url VARCHAR(255),
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 23. PAYMENT_GATEWAYS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_gateways (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'BOTH',
    documentation_url VARCHAR(255),
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO payment_gateways (name, code, type) VALUES
('PayU Colombia', 'PAYU', 'BOTH'),
('ePayco', 'EPAYCO', 'BOTH'),
('Nequi API', 'NEQUI', 'POS'),
('Daviplata API', 'DAVIPLATA', 'POS')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 24. FUNCTIONS
-- ============================================================================

-- Función: Crear esquema de tenant al registrar una empresa
CREATE OR REPLACE FUNCTION create_tenant_schema(p_tenant_id UUID, p_schema_name VARCHAR)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema_name);
    UPDATE tenants
    SET status = 'ACTIVE',
        activated_at = CURRENT_TIMESTAMP
    WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Función: Registrar evento de auditoría (helper)
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_user_id UUID,
    p_category VARCHAR,
    p_action VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_target_tenant_id UUID DEFAULT NULL,
    p_module VARCHAR DEFAULT NULL,
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id VARCHAR DEFAULT NULL,
    p_data_before JSONB DEFAULT NULL,
    p_data_after JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_id VARCHAR DEFAULT NULL,
    p_result VARCHAR DEFAULT 'SUCCESS'
) RETURNS BIGINT AS $$
DECLARE
    v_log_id BIGINT;
    v_admin_email VARCHAR;
    v_admin_role VARCHAR;
BEGIN
    SELECT email INTO v_admin_email FROM admin_users WHERE id = p_admin_user_id;
    SELECT r.code INTO v_admin_role FROM admin_users u JOIN admin_roles r ON u.role_id = r.id WHERE u.id = p_admin_user_id;

    INSERT INTO admin_audit_logs (
        admin_user_id, admin_email, admin_role,
        category, action, description,
        target_tenant_id, module, entity_type, entity_id,
        data_before, data_after,
        ip_address, user_agent, request_id, result
    ) VALUES (
        p_admin_user_id, v_admin_email, v_admin_role,
        p_category, p_action, p_description,
        p_target_tenant_id, p_module, p_entity_type, p_entity_id,
        p_data_before, p_data_after,
        p_ip_address, p_user_agent, p_request_id, p_result
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 25. VIEW: Dashboard KPIs
-- ============================================================================
CREATE OR REPLACE VIEW v_admin_dashboard_kpis AS
SELECT
    (SELECT COUNT(*) FROM tenants WHERE status = 'ACTIVE') AS active_companies,
    (SELECT COUNT(*) FROM tenants WHERE status = 'TRIAL') AS trial_companies,
    (SELECT COUNT(*) FROM tenants WHERE status = 'SUSPENDED') AS suspended_companies,
    COALESCE(
        (SELECT SUM(price_paid_monthly)
         FROM licenses
         WHERE status = 'ACTIVE'
           AND license_type = 'PAID'
           AND expires_at > CURRENT_TIMESTAMP), 0
    ) AS mrr,
    (SELECT COUNT(*) FROM tenants
     WHERE registered_at >= date_trunc('month', CURRENT_TIMESTAMP)) AS new_contracts_month,
    (SELECT COUNT(*) FROM licenses
     WHERE status = 'ACTIVE'
       AND expires_at BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '30 days') AS licenses_expiring_30d,
    (SELECT COUNT(*) FROM support_tickets WHERE status NOT IN ('CLOSED')) AS open_tickets;

-- ============================================================================
-- 26. SEED DATA: Admin super-usuario por defecto
-- Credenciales predeterminadas:
--   Email: superadmin@escriba.co
--   Contraseña: AdminEscriba2025!
-- ============================================================================
DO $$
DECLARE
    v_sa_role_id SMALLINT;
    v_admin_exists BOOLEAN;
BEGIN
    SELECT id INTO v_sa_role_id FROM admin_roles WHERE code = 'SA';
    SELECT EXISTS(SELECT 1 FROM admin_users WHERE email = 'superadmin@escriba.co') INTO v_admin_exists;

    IF NOT v_admin_exists AND v_sa_role_id IS NOT NULL THEN
        INSERT INTO admin_users (email, first_name, last_name, role_id, password_hash, totp_enabled, status)
        VALUES ('superadmin@escriba.co', 'Super', 'Admin', v_sa_role_id,
                '$2a$10$lOHOtMOt5NXFTW2ybeVhT.t6Hz.pSBWfoDj8izDFSClLVzpv1E60m',
                FALSE, 'ACTIVE');
    END IF;
END;
$$;
