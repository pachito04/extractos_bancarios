"use strict";
/**
 * extractor-bancario — Public API
 *
 * Single entry point for all consumers:
 *   - n8n HTTP server (server/http-server.ts)
 *   - Lovable / SaaS frontend (via bundler)
 *   - CLI scripts
 *   - Tests
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ACCOUNT_PLAN = exports.generateExcelFromResult = void 0;
exports.processExtract = processExtract;
exports.previewExtract = previewExtract;
const text_extractor_1 = require("./extractor/text-extractor");
const bank_detector_1 = require("./detector/bank-detector");
const registry_1 = require("./parsers/registry");
const movement_normalizer_1 = require("./normalizer/movement-normalizer");
const movement_validator_1 = require("./validator/movement-validator");
const accounting_classifier_1 = require("./classifier/accounting-classifier");
const libro_diario_1 = require("./generator/libro-diario");
const base_parser_1 = require("./parsers/base-parser");
var excel_generator_1 = require("./generator/excel-generator");
Object.defineProperty(exports, "generateExcelFromResult", { enumerable: true, get: function () { return excel_generator_1.generateExcelFromResult; } });
var libro_diario_2 = require("./generator/libro-diario");
Object.defineProperty(exports, "DEFAULT_ACCOUNT_PLAN", { enumerable: true, get: function () { return libro_diario_2.DEFAULT_ACCOUNT_PLAN; } });
__exportStar(require("./types"), exports);
/**
 * Full pipeline:
 *   extract text → detect bank → parse → normalize → validate → classify → libro diario
 *
 * Returns the canonical JSON result. Excel is generated separately via
 * generateExcelFromResult(result).
 */
async function processExtract(input) {
    const { fileBuffer, fileName, mimeType, accountPlanConfig = libro_diario_1.DEFAULT_ACCOUNT_PLAN } = input;
    // A. Extract text
    const extracted = await (0, text_extractor_1.extractText)(fileBuffer, mimeType);
    // B. Detect bank
    const detection = (0, bank_detector_1.detectBank)(extracted.raw_text);
    // C. Parse movements
    const parser = (0, registry_1.getParser)(detection.bank_code);
    let rawMovements = parser ? parser.parse(extracted.raw_text) : [];
    const parserUsed = parser ? detection.bank_code : 'NONE';
    // D. Normalize
    const normalised = (0, movement_normalizer_1.normalizeMovements)(rawMovements, detection.bank_code, fileName);
    // E. Validate
    const validated = (0, movement_validator_1.validateMovements)(normalised);
    // F. Classify
    const classified = (0, accounting_classifier_1.classifyMovements)(validated);
    // G. Libro Diario
    const libro_diario = (0, libro_diario_1.generateLibroDiario)(classified, accountPlanConfig);
    // Build observations list
    const observations = [];
    for (const mov of validated) {
        if (mov.validation_reason) {
            observations.push(`[${mov.fecha}] ${mov.descripcion}: ${mov.validation_reason}`);
        }
    }
    // Build resumen
    const resumen = buildResumen(validated);
    const review_required_count = classified.filter((m) => m.review_required).length;
    return {
        raw_text: extracted.raw_text,
        extraction_method: extracted.method,
        extraction_confidence: extracted.confidence,
        bank_code: detection.bank_code,
        bank_name: detection.bank_name,
        detector_confidence: detection.confidence,
        parser_used: parserUsed,
        movements: validated,
        classified_movements: classified,
        libro_diario,
        observations,
        review_required_count,
        resumen,
    };
}
/**
 * Quick preview: extract, detect, parse, validate, classify — no Excel generation.
 * Ideal for UI preview before generating the final report.
 */
async function previewExtract(input) {
    const result = await processExtract(input);
    return {
        bank_code: result.bank_code,
        bank_name: result.bank_name,
        detector_confidence: result.detector_confidence,
        extraction_method: result.extraction_method,
        movements: result.movements,
        classified_movements: result.classified_movements,
        observations: result.observations,
        review_required_count: result.review_required_count,
    };
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildResumen(validated) {
    let total_debitos = 0;
    let total_creditos = 0;
    let validos = 0;
    let dudosos = 0;
    let invalidos = 0;
    for (const m of validated) {
        total_debitos += m.debito;
        total_creditos += m.credito;
        if (m.validation_status === 'valid')
            validos++;
        if (m.validation_status === 'doubtful')
            dudosos++;
        if (m.validation_status === 'invalid')
            invalidos++;
    }
    const saldo_inicial = validated.length > 0
        ? (0, base_parser_1.round2)(validated[0].saldo - validated[0].credito + validated[0].debito)
        : 0;
    const saldo_final = validated.length > 0
        ? validated[validated.length - 1].saldo
        : 0;
    return {
        total_movimientos: validated.length,
        validos,
        dudosos,
        invalidos,
        total_debitos: (0, base_parser_1.round2)(total_debitos),
        total_creditos: (0, base_parser_1.round2)(total_creditos),
        saldo_inicial,
        saldo_final,
    };
}
//# sourceMappingURL=index.js.map