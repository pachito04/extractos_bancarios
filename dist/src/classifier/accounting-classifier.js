"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyMovements = classifyMovements;
const RULES = [
    // ── GASTOS BANCARIOS ────────────────────────────────────────────────────
    {
        categoria: 'GASTO_BANCARIO',
        exact: [
            /\bMANTENIMIENTO\b/, /\bCOMISION\b/, /\bCOMISIONES\b/,
            /\bCARGO CAJA\b/, /\bCARGO AH\b/, /IMP\.?\s*DEBITOS\b/,
            /\bIMPUESTO A LOS DEBITOS\b/, /\bIMP CREDITOS\b/,
            /\bCOSTO MANTENIMIENTO\b/, /\bGASTO BANCARIO\b/,
            /\bCARGO POR SERVICIO\b/, /\bCARGO MENSUAL\b/,
            /\bDEBITO AUTOMATICO BANCO\b/, /\bSEGURO DE TARJETA\b/,
        ],
        contextual: [
            /\bCARGO\b/, /\bCOMIS\b/,
        ],
    },
    // ── IMPUESTOS Y RETENCIONES ─────────────────────────────────────────────
    {
        categoria: 'IMPUESTO_RETENCION',
        exact: [
            /\bIIBB\b/, /\bINGRESOS BRUTOS\b/, /\bRETENCION\b/,
            /\bRETENCIONES\b/, /\bPERCEPCION\b/, /\bPERCEPCIONES\b/,
            /\bARBA\b/, /\bAGIP\b/, /\bAFIP\b/, /\bRENTA\b/,
            /\bSIRCREB\b/, /\bREACUD\b/, /\bDGR\b/,
            /\bIMPUESTO\s+SOBRE\s+CREDITOS\b/, /\bIMPUESTO\s+DEBITOS\b/,
            /\bLEY\s+25\.413\b/, /\bIMPUESTO\s+CHEQUES\b/,
        ],
        contextual: [
            /\bIMPUESTO\b/, /\bRET\.?\b/, /\bPERC\.?\b/,
        ],
    },
    // ── TRANSFERENCIAS INTERNAS ─────────────────────────────────────────────
    {
        categoria: 'TRANSFERENCIA_INTERNA',
        exact: [
            /TRANSFERENCIA PROPIA/, /ENTRE CUENTAS/, /PASE INTERNO/,
            /TRASPASO ENTRE CUENTAS/, /TRANSFERENCIA ENTRE CUENTAS/,
        ],
        contextual: [
            /\bTRANSF\.?\s+PROPIA\b/, /\bTRASPASO\b/,
        ],
    },
    // ── RETIRO ──────────────────────────────────────────────────────────────
    {
        categoria: 'RETIRO',
        exact: [
            /\bEXTRACCION\b/, /\bRETIRO\b/, /\bRETIRO ATM\b/,
            /\bEXTRACCION EN ATM\b/, /\bEXTRACCION CAJERO\b/,
            /\bEXTRACCION VENTANILLA\b/, /\bEXTRACCION AUTOMATICA\b/,
        ],
        contextual: [
            /\bATM\b/, /\bCAJERO\b/,
        ],
    },
    // ── APORTE DE CAPITAL ────────────────────────────────────────────────────
    {
        categoria: 'APORTE',
        exact: [
            /\bAPORTE DE CAPITAL\b/, /\bAPORTE SOCIO\b/, /\bAPORTE IRREVOCABLE\b/,
            /\bAPORTE DE SOCIOS\b/,
        ],
        contextual: [
            /\bAPORTE\b/,
        ],
    },
    // ── INGRESO OPERATIVO ────────────────────────────────────────────────────
    {
        categoria: 'INGRESO_OPERATIVO',
        exact: [
            /\bACREDITACION DE HABERES\b/, /\bACREDITACION HABERES\b/,
            /\bACREDITACION SUELDO\b/, /\bCOBRO DE FACTURA\b/,
            /\bCOBRO FACTURA\b/, /\bCOBRO DE CLIENTE\b/,
            /\bVENTA DE\b/, /\bCOBRO VENTAS\b/,
        ],
        contextual: [
            /\bACREDITACION\b/, /\bDEPOSITO\b/,
        ],
    },
    // ── COBRO DE CLIENTES ────────────────────────────────────────────────────
    {
        categoria: 'COBRO_CLIENTE',
        exact: [
            /\bCOBRO CLIENTE\b/, /\bCOBRANZA\b/, /\bCHEQUE ACREDITADO\b/,
            /\bACREDITACION CHEQUE\b/, /\bDEPOSITO CHEQUE\b/,
            /\bPAGO DE CLIENTE\b/,
        ],
        contextual: [
            /\bCHEQUE\b/, /\bCOBRANZA\b/,
        ],
    },
    // ── PAGO A PROVEEDORES ───────────────────────────────────────────────────
    {
        categoria: 'PAGO_PROVEEDOR',
        exact: [
            /\bPAGO PROVEEDOR\b/, /\bPAGO A PROVEEDOR\b/, /\bPAGO DE FACTURA\b/,
            /\bORDEN DE PAGO\b/, /\bTRANSFERENCIA A PROVEEDOR\b/,
        ],
        contextual: [
            /\bPROVEEDOR\b/, /\bO\.P\.\b/,
        ],
    },
    // ── SERVICIOS ───────────────────────────────────────────────────────────
    {
        categoria: 'SERVICIO',
        exact: [
            /\bEDENOR\b/, /\bEDESUR\b/, /\bAYSA\b/, /\bAGOS\b/,
            /\bMETROGAS\b/, /\bLITORALGAS\b/, /\bCLARO\b/, /\bPERSONAL\b/,
            /\bMOVISTAR\b/, /\bTELECOM\b/, /\bFIBERTEL\b/, /\bCOSTA NORTE\b/,
            /\bEPEC\b/, /\bOSDE\b/, /\bGALENO\b/, /\bSWISS MEDICAL\b/,
            /\bTELEFONO\b/, /\bAGUA\b/, /\bLUZ\b/, /\bGAS\b/,
        ],
        contextual: [
            /\bSERVICIO\b/, /\bFACTURA\s+\d/,
        ],
    },
];
// ---------------------------------------------------------------------------
// Classifier
// ---------------------------------------------------------------------------
function normalise(s) {
    return s
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}
function classifyMovement(mov) {
    const desc = normalise(mov.descripcion);
    // Test exact rules first
    for (const rule of RULES) {
        if (rule.exact.some((re) => re.test(desc))) {
            return {
                ...mov,
                categoria: rule.categoria,
                subcategoria: rule.subcategoria,
                classification_source: 'rule_exact',
                classification_confidence: 'high',
                review_required: false,
            };
        }
    }
    // Test contextual rules
    for (const rule of RULES) {
        if (rule.contextual?.some((re) => re.test(desc))) {
            return {
                ...mov,
                categoria: rule.categoria,
                subcategoria: rule.subcategoria,
                classification_source: 'rule_contextual',
                classification_confidence: 'medium',
                review_required: true,
                review_reason: `Clasificado por patron contextual en descripcion: "${mov.descripcion}"`,
            };
        }
    }
    // Fallback
    return {
        ...mov,
        categoria: 'OTROS',
        classification_source: 'fallback',
        classification_confidence: 'low',
        review_required: true,
        review_reason: `Sin patron de clasificacion para: "${mov.descripcion}"`,
    };
}
/**
 * Classify a list of validated movements into accounting categories.
 */
function classifyMovements(movements) {
    return movements.map(classifyMovement);
}
//# sourceMappingURL=accounting-classifier.js.map