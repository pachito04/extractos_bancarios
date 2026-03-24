"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExcelFromResult = generateExcelFromResult;
const base_parser_1 = require("../parsers/base-parser");
// SheetJS (xlsx) — browser-compatible
// eslint-disable-next-line @typescript-eslint/no-var-requires
const XLSX = require('xlsx');
// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------
const LIBRO_DIARIO_HEADERS = [
    'N° Asiento', 'Fecha', 'Cuenta Debe', 'Cuenta Haber',
    'Concepto', 'Importe', 'Banco', 'Categoría', 'Revisión',
];
const OBSERVACIONES_HEADERS = [
    'Fecha', 'Descripción', 'Débito', 'Crédito', 'Saldo',
    'Estado', 'Razón', 'Banco', 'Categoría', 'Fuente',
];
const RESUMEN_HEADERS = ['Concepto', 'Valor'];
// ---------------------------------------------------------------------------
// Sheet builders
// ---------------------------------------------------------------------------
function buildLibroDiarioSheet(entries) {
    const rows = [LIBRO_DIARIO_HEADERS];
    for (const e of entries) {
        rows.push([
            e.numero_asiento,
            e.fecha,
            e.cuenta_debe,
            e.cuenta_haber,
            e.concepto,
            e.importe,
            e.banco,
            e.categoria,
            e.review_required ? 'SÍ' : '',
        ]);
    }
    return rows;
}
function buildObservacionesSheet(movements) {
    const flagged = movements.filter((m) => m.validation_status !== 'valid' || m.review_required);
    const rows = [OBSERVACIONES_HEADERS];
    for (const m of flagged) {
        rows.push([
            m.fecha,
            m.descripcion,
            (0, base_parser_1.formatArgentino)(m.debito),
            (0, base_parser_1.formatArgentino)(m.credito),
            (0, base_parser_1.formatArgentino)(m.saldo),
            m.validation_status,
            m.validation_reason || m.review_reason || '',
            m.banco,
            m.categoria,
            m.source_method,
        ]);
    }
    return rows;
}
function buildResumenSheet(result) {
    const { resumen, bank_name, extraction_method, detector_confidence, review_required_count } = result;
    const rows = [RESUMEN_HEADERS];
    rows.push(['Banco', bank_name]);
    rows.push(['Archivo', result.libro_diario[0]?.archivo_origen ?? '']);
    rows.push(['Método extracción', extraction_method]);
    rows.push(['Confianza detector', `${(detector_confidence * 100).toFixed(0)}%`]);
    rows.push(['']);
    rows.push(['Total movimientos', resumen.total_movimientos]);
    rows.push(['Válidos', resumen.validos]);
    rows.push(['Dudosos', resumen.dudosos]);
    rows.push(['Inválidos', resumen.invalidos]);
    rows.push(['Para revisión', review_required_count]);
    rows.push(['']);
    rows.push(['Total débitos', resumen.total_debitos]);
    rows.push(['Total créditos', resumen.total_creditos]);
    rows.push(['Saldo inicial', resumen.saldo_inicial]);
    rows.push(['Saldo final', resumen.saldo_final]);
    // Totals by category
    rows.push(['']);
    rows.push(['── Por Categoría ──', '']);
    const cats = {};
    for (const mov of result.classified_movements) {
        cats[mov.categoria] = (cats[mov.categoria] ?? 0) + Math.max(mov.debito, mov.credito);
    }
    for (const [cat, total] of Object.entries(cats).sort(([a], [b]) => a.localeCompare(b))) {
        rows.push([cat, total]);
    }
    return rows;
}
// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------
function applyStyles(ws, headerRow) {
    // Set column widths
    ws['!cols'] = headerRow.map((h) => ({ wch: Math.max(h.length + 4, 15) }));
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Generate an Excel workbook (Buffer) with 3 sheets from a ProcessResult.
 * Works in Node.js (returns Buffer).
 */
function generateExcelFromResult(result) {
    const wb = XLSX.utils.book_new();
    // Sheet 1: Libro Diario
    const ldData = buildLibroDiarioSheet(result.libro_diario);
    const wsLD = XLSX.utils.aoa_to_sheet(ldData);
    applyStyles(wsLD, LIBRO_DIARIO_HEADERS);
    XLSX.utils.book_append_sheet(wb, wsLD, 'Libro Diario');
    // Sheet 2: Observaciones
    const obsData = buildObservacionesSheet(result.classified_movements);
    const wsObs = XLSX.utils.aoa_to_sheet(obsData);
    applyStyles(wsObs, OBSERVACIONES_HEADERS);
    XLSX.utils.book_append_sheet(wb, wsObs, 'Observaciones');
    // Sheet 3: Resumen
    const resData = buildResumenSheet(result);
    const wsRes = XLSX.utils.aoa_to_sheet(resData);
    applyStyles(wsRes, RESUMEN_HEADERS);
    XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen');
    // Write to Buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buf;
}
//# sourceMappingURL=excel-generator.js.map