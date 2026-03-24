"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMovements = normalizeMovements;
const base_parser_1 = require("../parsers/base-parser");
let batchCounter = 0;
function generateBatchId(fileName) {
    batchCounter++;
    const ts = Date.now();
    const slug = fileName.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
    return `${slug}_${ts}_${batchCounter}`;
}
/**
 * Normalise raw movements from any parser into a unified schema.
 *
 * - Dates → DD/MM/YYYY
 * - Amounts → numbers (already done by parsers, but re-validates)
 * - Sets banco, archivo_origen, batch_id, confidence
 */
function normalizeMovements(raw, bankCode, fileName) {
    const batchId = generateBatchId(fileName);
    return raw.map((r) => {
        const debito = (0, base_parser_1.round2)(typeof r.debito === 'number' ? r.debito : (0, base_parser_1.parseAmount)(r.debito));
        const credito = (0, base_parser_1.round2)(typeof r.credito === 'number' ? r.credito : (0, base_parser_1.parseAmount)(r.credito));
        const saldo = (0, base_parser_1.round2)(typeof r.saldo === 'number' ? r.saldo : (0, base_parser_1.parseAmount)(r.saldo));
        const fecha = (0, base_parser_1.normalizeDate)(r.fecha ?? '');
        const descripcion = (0, base_parser_1.cleanDesc)(r.descripcion ?? '');
        // Confidence: column_parse is inherently more reliable than delta inference
        const confidence = r.source_method === 'column_parse' ? 'high' :
            r.source_method === 'saldo_delta' ? 'medium' :
                r.source_method === 'ocr_reconstructed' ? 'low' : 'medium';
        return {
            fecha,
            descripcion,
            debito,
            credito,
            saldo,
            source_method: r.source_method,
            banco: bankCode,
            archivo_origen: fileName,
            batch_id: batchId,
            confidence,
        };
    });
}
//# sourceMappingURL=movement-normalizer.js.map