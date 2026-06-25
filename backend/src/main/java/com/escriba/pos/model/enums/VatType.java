package com.escriba.pos.model.enums;

/**
 * Clasificación de IVA para productos según la normativa colombiana.
 * 
 * Basado en la Ley 1819 de 2016 (Reforma Tributaria) y Ley 2277 de 2022.
 * 
 * ╔════════════════╦═══════════════════════════════════════════════════════════╗
 * ║     Código     ║   Descripción                                            ║
 * ╠════════════════╬═══════════════════════════════════════════════════════════╣
 * ║ STANDARD       ║ IVA General 19% (bienes y servicios gravados)           ║
 * ║ REDUCED        ║ IVA Reducido 5% (alimentos básicos, insumos agrícolas)  ║
 * ║ EXEMPT         ║ Exento - 0% con derecho a descuento (exportaciones)     ║
 * ║ EXCLUDED       ║ Excluido - no causa IVA (alimentos frescos, salud)       ║
 * ║ ZERO           ║ 0% temporal / tasa 0                                     ║
 * ║ NOT_APPLICABLE ║ No aplica (servicios financieros, etc.)                  ║
 * ╚════════════════╩═══════════════════════════════════════════════════════════╝
 * 
 * Cada producto puede tener su propio vat_rate configurable.
 * La empresa define la tarifa por defecto en system_parameters (default_vat_rate).
 */
public enum VatType {
    
    /**
     * IVA General (19% en 2025)
     * Aplica a la mayoría de bienes y servicios comerciales:
     * - Electrónicos, electrodomésticos
     * - Ropa y calzado
     * - Bebidas (gaseosas, alcohólicas)
     * - Productos procesados
     * - Cosméticos y aseo personal
     * - Restaurantes
     */
    STANDARD("19%", "IVA General"),
    
    /**
     * IVA Reducido (5% en 2025)
     * Aplica a productos específicos según la Ley:
     * - Café sin tostar
     * - Maíz, arroz
     * - Algunos insumos agrícolas
     * - Transporte público terrestre de pasajeros (segmento)
     */
    REDUCED("5%", "IVA Reducido"),
    
    /**
     * Exento - Tarifa 0% con derecho a descuento en IVA
     * - Exportaciones
     * - Algunos servicios internacionales
     */
    EXEMPT("0%", "Exento"),
    
    /**
     * Excluido - No causa IVA (no genera impuesto)
     * El vendedor NO cobra IVA y NO puede descontar IVA de sus compras.
     * - Alimentos frescos sin procesar (carnes, pescados, frutas, verduras)
     * - Leche, huevos, pan (básico)
     * - Medicamentos esenciales
     * - Educación y salud
     */
    EXCLUDED("Excluido", "Excluido de IVA"),
    
    /**
     * Tasa 0% temporal o especial
     */
    ZERO("0%", "Tasa 0%"),
    
    /**
     * No aplica IVA (servicios financieros, seguros, etc.)
     */
    NOT_APPLICABLE("N/A", "No aplica");

    private final String rateLabel;
    private final String displayName;

    VatType(String rateLabel, String displayName) {
        this.rateLabel = rateLabel;
        this.displayName = displayName;
    }

    public String getRateLabel() {
        return rateLabel;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Returns the default VAT rate for this type (in percentage).
     */
    public double getDefaultRate() {
        return switch (this) {
            case STANDARD -> 19.0;
            case REDUCED -> 5.0;
            case EXEMPT, ZERO -> 0.0;
            case EXCLUDED, NOT_APPLICABLE -> 0.0;
        };
    }

    /**
     * Whether this VAT type generates a tax that must be reported to DIAN.
     */
    public boolean isTaxable() {
        return this == STANDARD || this == REDUCED;
    }
}
