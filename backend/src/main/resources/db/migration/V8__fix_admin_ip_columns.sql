-- ============================================================================
-- ESCRIBA POS v2 — Alineación de esquema admin con entidades JPA (V8)
--
-- V5__admin_schema.sql (y database/init/02-admin-schema.sql) definen algunos
-- tipos que NO coinciden con las entidades JPA. En una base de datos NUEVA,
-- Hibernate con `ddl-auto: validate` falla al arrancar:
--
--   1) Columnas IP definidas como INET pero mapeadas como String:
--        * AdminUser.lastLoginIp          -> admin_users.last_login_ip
--        * AdminRefreshToken.ipAddress    -> admin_refresh_tokens.ip_address
--        * AdminAuditLog.ipAddress        -> admin_audit_logs.ip_address
--      Error: "found [inet (Types#OTHER)], but expecting [varchar(255)]"
--
--   2) plans.id definido SMALLSERIAL pero la entidad Plan usa Integer:
--        Error: "found [smallserial (Types#SMALLINT)], but expecting
--                [integer (Types#INTEGER)]"
--      (plan_modules.plan_id y licenses.plan_id ya son INT, así que la FK
--       queda consistente tras el cambio.)
--
--   3) tenants.tax_responsibilities definido TEXT[] pero la entidad Tenant lo
--      mapea como String con columnDefinition = "TEXT".
--
--   Las BD inicializadas con versiones antiguas de 02-admin-schema.sql tenían
--   los tipos correctos y por eso el arranque funcionaba en local (el V5 era
--   no-op por CREATE TABLE IF NOT EXISTS).
--
-- Idempotente: ALTER COLUMN TYPE al mismo tipo es un no-op; la función se
-- recrea con CREATE OR REPLACE.
-- ============================================================================

ALTER TABLE admin_users         ALTER COLUMN last_login_ip TYPE VARCHAR(255);
ALTER TABLE admin_refresh_tokens ALTER COLUMN ip_address   TYPE VARCHAR(255);
ALTER TABLE admin_audit_logs    ALTER COLUMN ip_address    TYPE VARCHAR(255);

-- plans.id: SMALLSERIAL -> INTEGER (entidad Plan.id = Integer).
-- Las FKs (plan_modules.plan_id, licenses.plan_id) ya son INT.
ALTER TABLE plans ALTER COLUMN id TYPE INTEGER;

-- tenants.tax_responsibilities: TEXT[] -> TEXT (entidad Tenant = String/TEXT).
ALTER TABLE tenants ALTER COLUMN tax_responsibilities TYPE TEXT USING tax_responsibilities::text;

-- Recrear la función de auditoría (nadie la invoca desde Java; solo DDL).
-- Se elimina la versión con firma INET para evitar duplicados por el cambio
-- de tipo de parámetro (CREATE OR REPLACE no permite cambiar tipos de argumento).
DROP FUNCTION IF EXISTS log_admin_action(
    UUID, VARCHAR, VARCHAR, TEXT, UUID, VARCHAR, VARCHAR, VARCHAR, JSONB, JSONB, INET, TEXT, VARCHAR, VARCHAR
);

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
    p_ip_address VARCHAR(255) DEFAULT NULL,
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
