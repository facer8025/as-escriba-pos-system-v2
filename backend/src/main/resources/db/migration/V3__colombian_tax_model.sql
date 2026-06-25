-- ============================================================================
-- ESCRIBA POS - Modelo Tributario Colombiano (V3)
-- Agrega parámetros de IVA según normativa colombiana
-- Ley 1819 de 2016 + Ley 2277 de 2022
-- ============================================================================

-- Agregar parámetros de IVA para la empresa demo
INSERT INTO system_parameters (company_id, param_category, param_key, param_value, param_type, description)
SELECT 
    id,
    'TAX',
    param_key,
    param_value,
    param_type,
    description
FROM companies,
(VALUES
    ('vat_rates_available', '19,5,0', 'SELECT', 'Tarifas de IVA disponibles para productos (separadas por coma)'),
    ('reduced_vat_products', 'cafe,maiz,arroz,trigo,insumos_agricolas', 'TEXT', 'Productos con IVA reducido al 5% (categorías)'),
    ('excluded_vat_products', 'carnes_frescas,pescados,leche,huevos,frutas,verduras,pan_basico,medicamentos', 'TEXT', 'Productos excluidos de IVA (categorías)'),
    ('dian_iva19_code', '01', 'TEXT', 'Código DIAN para IVA 19%'),
    ('dian_iva5_code', '02', 'TEXT', 'Código DIAN para IVA 5%'),
    ('dian_excluded_code', '03', 'TEXT', 'Código DIAN para productos excluidos'),
    ('dian_exempt_code', '04', 'TEXT', 'Código DIAN para productos exentos'),
    ('price_includes_vat', 'true', 'BOOLEAN', 'Los precios de venta incluyen IVA por defecto'),
    ('show_vat_on_ticket', 'true', 'BOOLEAN', 'Mostrar IVA desglosado en el ticket')
) AS t(param_key, param_value, param_type, description)
WHERE NOT EXISTS (
    SELECT 1 FROM system_parameters sp 
    WHERE sp.company_id = companies.id AND sp.param_key = t.param_key
);

-- ============================================================================
-- ACTUALIZAR PRODUCTOS DEMO CON IVA COLOMBIANO CORRECTO
-- ============================================================================

-- Arroz Diana x 500g → IVA Reducido 5% (alimento básico)
UPDATE products 
SET vat_type = 'REDUCED', vat_rate = 5, vat_included = true
WHERE internal_code = 'PROD-001';

-- Aceite Vegetal x 900ml → IVA General 19%
UPDATE products 
SET vat_type = 'STANDARD', vat_rate = 19, vat_included = true
WHERE internal_code = 'PROD-002';

-- Leche Entera x 1L → EXCLUIDO de IVA (alimento fresco básico)
UPDATE products 
SET vat_type = 'EXCLUDED', vat_rate = 0, vat_included = false
WHERE internal_code = 'PROD-003';

-- Pan Bimbo x 500g → Excluido (pan básico)
UPDATE products 
SET vat_type = 'EXCLUDED', vat_rate = 0, vat_included = false
WHERE internal_code = 'PROD-004';

-- Gaseosa Coca-Cola x 2.5L → IVA General 19% (bebida)
UPDATE products 
SET vat_type = 'STANDARD', vat_rate = 19, vat_included = true
WHERE internal_code = 'PROD-005';
