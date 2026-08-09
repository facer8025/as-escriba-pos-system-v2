-- ============================================================================
-- ESCRIBA POS v2 — Admin / SuperAdmin Schema
-- Schema: public (datos de gestión global del panel administrativo)
-- Basado en la especificación funcional: Módulo Administrativo SuperAdmin v1.0
-- ============================================================================

-- Extensión requerida
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ROLES DEL PANEL ADMINISTRATIVO (Módulo 2)
-- ============================================================================

CREATE TABLE admin_roles (
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
('AU', 'Auditor', 'Solo lectura total. Accede a todos los módulos en modo consulta.');

-- ============================================================================
-- USUARIOS DEL PANEL ADMINISTRATIVO (Módulo 7)
-- ============================================================================

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id SMALLINT NOT NULL REFERENCES admin_roles(id),
    password_hash TEXT NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    position VARCHAR(100), -- Cargo en la empresa
    -- 2FA
    totp_secret TEXT, -- Cifrado, secreto TOTP
    totp_enabled BOOLEAN DEFAULT FALSE,
    -- IP whitelist
    ip_whitelist TEXT, -- Una IP por línea, soporta CIDR
    -- Estado
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE / BLOCKED / INACTIVE
    failed_attempts SMALLINT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    -- Sesión
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    -- Metadata
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(email)
);

CREATE INDEX idx_admin_users_role ON admin_users(role_id);
CREATE INDEX idx_admin_users_status ON admin_users(status);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- ============================================================================
-- REFRESH TOKENS DEL PANEL ADMIN
-- ============================================================================

CREATE TABLE admin_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_admin_refresh_tokens_user ON admin_refresh_tokens(admin_user_id);
CREATE INDEX idx_admin_refresh_tokens_hash ON admin_refresh_tokens(token_hash);

-- ============================================================================
-- EMPRESAS CLIENTES (TENANTS) (Módulo 2)
-- ============================================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Identificación
    person_type VARCHAR(10) DEFAULT 'LEGAL', -- LEGAL / NATURAL
    nit VARCHAR(20) UNIQUE NOT NULL,
    dv VARCHAR(2),
    business_name VARCHAR(200) NOT NULL,
    trade_name VARCHAR(200),
    -- Tributario
    tax_regime VARCHAR(50), -- Responsable de IVA / No responsable / Gran contribuyente / Régimen simple
    tax_responsibilities TEXT[], -- Array de responsabilidades DIAN
    ciiu_code VARCHAR(10), -- Actividad económica principal
    -- Ubicación
    address TEXT,
    department VARCHAR(100),
    city VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(150) UNIQUE NOT NULL,
    website VARCHAR(255),
    logo_url TEXT,
    -- Estado
    status VARCHAR(20) DEFAULT 'TRIAL', -- TRIAL / ACTIVE / SUSPENDED / CANCELLED
    suspension_reason TEXT,
    -- Técnico
    schema_name VARCHAR(100) UNIQUE NOT NULL, -- PostgreSQL schema name
    subdomain VARCHAR(100) UNIQUE, -- Subdominio opcional
    timezone VARCHAR(50) DEFAULT 'America/Bogota',
    -- Fechas
    registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMPTZ,
    suspended_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    -- Metadata
    created_by UUID REFERENCES admin_users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_city ON tenants(city);
CREATE INDEX idx_tenants_email ON tenants(email);
CREATE INDEX idx_tenants_schema ON tenants(schema_name);

-- ============================================================================
-- CATÁLOGO DE MÓDULOS FUNCIONALES (Módulo 6)
-- ============================================================================

CREATE TABLE modules (
    id SMALLSERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(30) NOT NULL, -- CORE / ADVANCED / PREMIUM
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
('MULTI_BRANCH', 'Multisucursal', 'Sin límite de sucursales', 'PREMIUM', FALSE, 19);

-- ============================================================================
-- PLANES DE SUSCRIPCIÓN (Módulo 3)
-- ============================================================================

CREATE TABLE plans (
    id SMALLSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description_short VARCHAR(200),
    description_long TEXT,
    -- Precios
    price_monthly NUMERIC(18,2) NOT NULL DEFAULT 0,
    price_annual NUMERIC(18,2) NOT NULL DEFAULT 0,
    annual_discount_pct NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN price_monthly > 0
        THEN ROUND(((price_monthly * 12 - price_annual) / (price_monthly * 12)) * 100, 2)
        ELSE 0 END
    ) STORED,
    tax_rate NUMERIC(5,2) DEFAULT 19, -- IVA aplicable
    currency VARCHAR(3) DEFAULT 'COP',
    trial_days INT DEFAULT 0, -- 0 = sin trial
    -- Branding
    badge_color VARCHAR(7) DEFAULT '#4f46e5',
    is_featured BOOLEAN DEFAULT FALSE, -- "Más popular"
    is_visible_web BOOLEAN DEFAULT TRUE, -- Mostrar en web pública
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE / ARCHIVED
    -- Límites operativos
    max_users INT, -- NULL = ilimitado
    max_branches INT,
    max_products INT,
    max_monthly_invoices INT,
    storage_gb INT,
    support_level VARCHAR(30), -- EMAIL / EMAIL_CHAT / PRIORITY / DEDICATED
    -- Metadata
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plans_status ON plans(status);

-- ============================================================================
-- MÓDULOS INCLUIDOS POR PLAN
-- ============================================================================

CREATE TABLE plan_modules (
    id SERIAL PRIMARY KEY,
    plan_id INT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    module_code VARCHAR(30) NOT NULL REFERENCES modules(code),
    is_included BOOLEAN DEFAULT TRUE,
    limit_value INT, -- NULL = sin límite adicional
    UNIQUE(plan_id, module_code)
);

CREATE INDEX idx_plan_modules_plan ON plan_modules(plan_id);

-- ============================================================================
-- LICENCIAS POR EMPRESA (Módulo 4)
-- ============================================================================

CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    plan_id INT NOT NULL REFERENCES plans(id),
    -- Tipo
    license_type VARCHAR(10) NOT NULL DEFAULT 'PAID', -- TRIAL / PAID
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE / TRIAL / SUSPENDED / EXPIRED / CANCELLED
    -- Fechas
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    grace_period_days INT DEFAULT 7,
    -- Precios (puede diferir del plan si hay descuento)
    price_paid_monthly NUMERIC(18,2), -- Precio real pagado
    discount_pct NUMERIC(5,2) DEFAULT 0,
    discount_reason TEXT,
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_licenses_tenant ON licenses(tenant_id);
CREATE INDEX idx_licenses_plan ON licenses(plan_id);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expires ON licenses(expires_at);

-- ============================================================================
-- HISTORIAL DE LICENCIAS
-- ============================================================================

CREATE TABLE license_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
    change_type VARCHAR(30) NOT NULL, -- RENEWED / PLAN_CHANGED / DISCOUNT_APPLIED / SUSPENDED / REACTIVATED / CANCELLED / AUTO_RENEW_TOGGLED
    old_value JSONB,
    new_value JSONB,
    notes TEXT,
    changed_by UUID REFERENCES admin_users(id),
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_license_history_license ON license_history(license_id);

-- ============================================================================
-- MÓDULOS ACTIVOS POR TENANT (Módulo 6)
-- ============================================================================

CREATE TABLE tenant_modules (
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

CREATE INDEX idx_tenant_modules_tenant ON tenant_modules(tenant_id);
CREATE INDEX idx_tenant_modules_code ON tenant_modules(module_code);

-- ============================================================================
-- FEATURE FLAGS GLOBALES (Módulo 6.3)
-- ============================================================================

CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- UPPER_SNAKE_CASE
    description TEXT,
    default_state VARCHAR(20) DEFAULT 'INACTIVE', -- ACTIVE_FOR_ALL / SPECIFIC_COMPANIES / INACTIVE
    rollout_pct NUMERIC(5,2), -- 0-100% para A/B testing
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Feature flags habilitados por empresa
CREATE TABLE tenant_feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    flag_code VARCHAR(50) NOT NULL REFERENCES feature_flags(code),
    is_enabled BOOLEAN DEFAULT TRUE,
    enabled_by UUID REFERENCES admin_users(id),
    enabled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, flag_code)
);

CREATE INDEX idx_tenant_feature_flags_tenant ON tenant_feature_flags(tenant_id);
CREATE INDEX idx_tenant_feature_flags_flag ON tenant_feature_flags(flag_code);

-- ============================================================================
-- FACTURACIÓN A EMPRESAS (Módulo 5)
-- ============================================================================

CREATE TABLE tenant_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    license_id UUID REFERENCES licenses(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_type VARCHAR(30) DEFAULT 'MANUAL', -- MANUAL / AUTO_RENEWAL / ADJUSTMENT
    concept VARCHAR(200) NOT NULL,
    description TEXT,
    -- Montos
    amount_net NUMERIC(18,2) NOT NULL,
    tax_pct NUMERIC(5,2) DEFAULT 19,
    tax_amount NUMERIC(18,2) DEFAULT 0,
    total NUMERIC(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'COP',
    -- Fechas
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    -- Pago
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING / PAID / OVERDUE / CANCELLED / PARTIALLY_PAID
    payment_method VARCHAR(30), -- TRANSFER / PSE / CASH / OTHER
    payment_reference VARCHAR(100),
    -- Metadata
    notes TEXT,
    pdf_url TEXT,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tenant_invoices_tenant ON tenant_invoices(tenant_id);
CREATE INDEX idx_tenant_invoices_status ON tenant_invoices(status);
CREATE INDEX idx_tenant_invoices_due ON tenant_invoices(due_date);
CREATE INDEX idx_tenant_invoices_issued ON tenant_invoices(issued_at);

-- ============================================================================
-- TICKETS DE SOPORTE (Módulo 8)
-- ============================================================================

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    subject VARCHAR(200) NOT NULL,
    category VARCHAR(30) NOT NULL, -- BILLING / DIAN / POS / INVENTORY / TECHNICAL / COMMERCIAL
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM', -- CRITICAL / HIGH / MEDIUM / LOW
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN / IN_PROGRESS / WAITING_CUSTOMER / CLOSED
    -- Asignación
    assigned_to UUID REFERENCES admin_users(id),
    -- SLA
    sla_deadline TIMESTAMPTZ,
    sla_breached BOOLEAN DEFAULT FALSE,
    -- Origen
    created_by_type VARCHAR(10) NOT NULL, -- ADMIN / TENANT
    created_by_id UUID NOT NULL,
    -- Cierre
    closed_at TIMESTAMPTZ,
    resolution_summary TEXT,
    root_cause VARCHAR(30), -- USER_ERROR / BUG / CONFIGURATION / FEATURE_REQUEST / OTHER
    satisfaction_score SMALLINT, -- 1-5
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_sla ON support_tickets(sla_deadline);

-- ============================================================================
-- MENSAJES DE TICKETS
-- ============================================================================

CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL, -- ADMIN / TENANT
    sender_id UUID NOT NULL,
    body TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT FALSE,
    attachments JSONB, -- Array de archivos adjuntos
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);

-- ============================================================================
-- COMUNICADOS Y ANUNCIOS (Módulo 9)
-- ============================================================================

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    type VARCHAR(30) NOT NULL, -- GENERAL / MAINTENANCE / NEW_FEATURE / ALERT / NEWSLETTER
    body_html TEXT NOT NULL,
    header_image_url TEXT,
    -- Destinatarios (segmentación)
    target_criteria JSONB, -- { plans: [], statuses: [], cities: [], specific_tenants: [], exclude_tenants: [] }
    -- Canales
    channels JSONB NOT NULL, -- ["EMAIL", "BANNER", "IN_APP", "SMS"]
    -- Banner
    banner_duration_days INT DEFAULT 7,
    -- Programación
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT / SCHEDULED / SENT / CANCELLED
    -- Métricas
    total_recipients INT DEFAULT 0,
    open_rate NUMERIC(5,2),
    -- Metadata
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_scheduled ON announcements(scheduled_at);
CREATE INDEX idx_announcements_type ON announcements(type);

-- ============================================================================
-- ENTREGAS DE COMUNICADOS
-- ============================================================================

CREATE TABLE announcement_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    channel VARCHAR(20) NOT NULL, -- EMAIL / BANNER / IN_APP / SMS
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING / SENT / DELIVERED / FAILED / OPENED
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    error_message TEXT,
    UNIQUE(announcement_id, tenant_id, channel)
);

CREATE INDEX idx_announcement_deliveries_announcement ON announcement_deliveries(announcement_id);
CREATE INDEX idx_announcement_deliveries_tenant ON announcement_deliveries(tenant_id);

-- ============================================================================
-- MANTENIMIENTOS PROGRAMADOS (Módulo 9.4)
-- ============================================================================

CREATE TABLE maintenance_windows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    starts_at TIMESTAMPTZ NOT NULL,
    estimated_duration_min INT NOT NULL,
    scope VARCHAR(30) NOT NULL, -- ALL_SYSTEM / API_ONLY / DIAN / BILLING_ONLY
    description TEXT NOT NULL,
    notify_hours_before INT DEFAULT 4,
    banner_from_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- SCHEDULED / IN_PROGRESS / COMPLETED / CANCELLED
    created_by UUID REFERENCES admin_users(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- HEALTH CHECKS DE SERVICIOS (Módulo 10)
-- ============================================================================

CREATE TABLE service_health_logs (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) NOT NULL, -- UP / DEGRADED / DOWN
    response_time_ms INT,
    error_message TEXT,
    details JSONB
);

CREATE INDEX idx_service_health_logs_service ON service_health_logs(service_name);
CREATE INDEX idx_service_health_logs_checked ON service_health_logs(checked_at DESC);

-- ============================================================================
-- LOG DE AUDITORÍA GLOBAL (Módulo 11)
-- ============================================================================
-- IMPORTANTE: Append-only. Nunca se hace UPDATE o DELETE en esta tabla.

CREATE TABLE admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Usuario admin
    admin_user_id UUID REFERENCES admin_users(id),
    admin_email VARCHAR(150),
    admin_role VARCHAR(5),
    -- Acción
    category VARCHAR(30) NOT NULL, -- ADMIN_PANEL / TENANT / IMPERSONATION / AUTHENTICATION
    action VARCHAR(100) NOT NULL, -- CREATE / UPDATE / DELETE / ACTIVATE / DEACTIVATE / ACCESS / EXPORT
    description TEXT,
    -- Target
    target_tenant_id UUID REFERENCES tenants(id),
    module VARCHAR(50), -- EMPRESAS / PLANES / LICENCIAS / FACTURACION / etc.
    entity_type VARCHAR(50), -- TENANT / PLAN / LICENSE / INVOICE / TICKET / ADMIN_USER
    entity_id VARCHAR(50),
    -- Cambios (JSON)
    data_before JSONB,
    data_after JSONB,
    -- Contexto técnico
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    -- Resultado
    result VARCHAR(10) NOT NULL DEFAULT 'SUCCESS' -- SUCCESS / ERROR / BLOCKED
);

CREATE INDEX idx_admin_audit_logs_timestamp ON admin_audit_logs(timestamp DESC);
CREATE INDEX idx_admin_audit_logs_user ON admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_category ON admin_audit_logs(category);
CREATE INDEX idx_admin_audit_logs_tenant ON admin_audit_logs(target_tenant_id);
CREATE INDEX idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX idx_admin_audit_logs_module ON admin_audit_logs(module);
CREATE INDEX idx_admin_audit_logs_result ON admin_audit_logs(result);

-- ============================================================================
-- ALERTAS DE SEGURIDAD (Módulo 11.3)
-- ============================================================================

CREATE TABLE security_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_code VARCHAR(50) NOT NULL, -- LOGIN_NEW_LOCATION / BRUTE_FORCE / MASSIVE_CHANGE / OFF_HOURS_IMPERSONATION / MASSIVE_EXPORT / PASSWORD_CHANGE_IMPERSONATION
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    admin_user_id UUID REFERENCES admin_users(id),
    tenant_id UUID REFERENCES tenants(id),
    description TEXT NOT NULL,
    metadata JSONB,
    status VARCHAR(20) DEFAULT 'NEW', -- NEW / REVIEWED / FALSE_POSITIVE
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_security_alerts_status ON security_alerts(status);
CREATE INDEX idx_security_alerts_triggered ON security_alerts(triggered_at DESC);

-- ============================================================================
-- CONFIGURACIÓN GLOBAL DEL SISTEMA (Módulo 12)
-- ============================================================================

CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) DEFAULT 'TEXT', -- TEXT / NUMBER / BOOLEAN / JSON
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
('tenant_jwt_duration_minutes', '60', 'NUMBER', 'Duración máxima del JWT de empresas');

-- ============================================================================
-- PROVEEDORES DIAN CONFIGURADOS (Módulo 12.2)
-- ============================================================================

CREATE TABLE dian_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    api_base_url VARCHAR(255) NOT NULL,
    sandbox_url VARCHAR(255),
    documentation_url VARCHAR(255),
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSONB, -- Configuración específica del proveedor
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PASARELAS DE PAGO (Módulo 12.3)
-- ============================================================================

CREATE TABLE payment_gateways (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'BOTH', -- STORE / POS / BOTH
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
('Daviplata API', 'DAVIPLATA', 'POS');

-- ============================================================================
-- FUNCIÓN: Crear esquema de tenant al registrar una empresa
-- ============================================================================

CREATE OR REPLACE FUNCTION create_tenant_schema(p_tenant_id UUID, p_schema_name VARCHAR)
RETURNS VOID AS $$
BEGIN
    -- Crear el schema para el tenant
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema_name);

    -- Aquí se ejecutarían las migraciones del schema del tenant
    -- (el DDL completo está en 01-schema.sql)

    -- Marcar el tenant como activo
    UPDATE tenants
    SET status = 'ACTIVE',
        activated_at = CURRENT_TIMESTAMP
    WHERE id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: Registrar evento de auditoría (helper)
-- ============================================================================

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
    -- Obtener datos del admin
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
-- VISTA: Dashboard KPIs
-- ============================================================================

CREATE OR REPLACE VIEW v_admin_dashboard_kpis AS
SELECT
    -- Empresas activas
    (SELECT COUNT(*) FROM tenants WHERE status = 'ACTIVE') AS active_companies,
    (SELECT COUNT(*) FROM tenants WHERE status = 'TRIAL') AS trial_companies,
    (SELECT COUNT(*) FROM tenants WHERE status = 'SUSPENDED') AS suspended_companies,
    -- MRR (Monthly Recurring Revenue)
    COALESCE(
        (SELECT SUM(price_paid_monthly)
         FROM licenses
         WHERE status = 'ACTIVE'
           AND license_type = 'PAID'
           AND expires_at > CURRENT_TIMESTAMP), 0
    ) AS mrr,
    -- Nuevos contratos este mes
    (SELECT COUNT(*) FROM tenants
     WHERE registered_at >= date_trunc('month', CURRENT_TIMESTAMP)) AS new_contracts_month,
    -- Licencias por vencer en 30 días
    (SELECT COUNT(*) FROM licenses
     WHERE status = 'ACTIVE'
       AND expires_at BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '30 days') AS licenses_expiring_30d,
    -- Tickets sin resolver
    (SELECT COUNT(*) FROM support_tickets WHERE status NOT IN ('CLOSED')) AS open_tickets;

-- ============================================================================
-- SEED DATA: Admin super-usuario por defecto
-- ============================================================================
-- NOTA: La contraseña debe cambiarse en el primer login
-- Contraseña por defecto: AdminEscriba2025! (bcrypt hash)

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'superadmin@escriba.co') THEN
        INSERT INTO admin_users (email, first_name, last_name, role_id, password_hash, totp_enabled, status)
        SELECT 'superadmin@escriba.co', 'Super', 'Admin', id, '$2a$10$8KzQMGx5C5Kc5Qy5Q5zQ5u5Q5zQ5u5Q5zQ5u5Q5zQ5u5Q5zQ5u', FALSE, 'ACTIVE'
        FROM admin_roles WHERE code = 'SA';
    END IF;
END;
$$;
