-- ============================================================================
-- ESCRIBA POS v2 — Columnas de admin en tenants (V7)
--
-- Guarda la referencia del usuario administrador de la empresa para poder:
--   * Autenticarse en el panel cliente (app.escriba.co)
--   * Generar tokens de impersonación sobre un usuario real
--
-- Idempotente: usa ADD COLUMN IF NOT EXISTS.
-- ============================================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS admin_email VARCHAR(150);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS admin_user_id UUID;

-- Backfill: los tenants existentes usan su email corporativo como email admin
UPDATE tenants SET admin_email = email WHERE admin_email IS NULL;
