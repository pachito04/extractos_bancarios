/**
 * extractor-bancario — Public API
 *
 * Single entry point for all consumers:
 *   - n8n HTTP server (server/http-server.ts)
 *   - Lovable / SaaS frontend (via bundler)
 *   - CLI scripts
 *   - Tests
 */

import type {
  ProcessResult, ProcessResumen,
  AccountPlanConfig, ValidatedMovement,
} from './types';

import { extractText }          from './extractor/text-extractor';
import { detectBank }           from './detector/bank-detector';
import { getParser }            from './parsers/registry';
import { normalizeMovements }   from './normalizer/movement-normalizer';
import { validateMovements }    from './validator/movement-validator';
import { classifyMovements }    from './classifier/accounting-classifier';
import { generateLibroDiario, DEFAULT_ACCOUNT_PLAN } from './generator/libro-diario';
import { generateExcelFromResult } from './generator/excel-generator';
import { round2 } from './parsers/base-parser';

export { generateExcelFromResult } from './generator/excel-generator';
export { DEFAULT_ACCOUNT_PLAN }    from './generator/libro-diario';
export * from './types';

// ---------------------------------------------------------------------------
// Core pipeline
// ---------------------------------------------------------------------------

export interface ProcessInput {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  accountPlanConfig?: AccountPlanConfig;
}

/**
 * Full pipeline:
 *   extract text → detect bank → parse → normalize → validate → classify → libro diario
 *
 * Returns the canonical JSON result. Excel is generated separately via
 * generateExcelFromResult(result).
 */
export async function processExtract(input: ProcessInput): Promise<ProcessResult> {
  const { fileBuffer, fileName, mimeType, accountPlanConfig = DEFAULT_ACCOUNT_PLAN } = input;

  // A. Extract text
  const extracted = await extractText(fileBuffer, mimeType);

  // B. Detect bank
  const detection = detectBank(extracted.raw_text);

  // C. Parse movements
  const parser = getParser(detection.bank_code);
  let rawMovements = parser ? parser.parse(extracted.raw_text) : [];
  const parserUsed = parser ? detection.bank_code : 'NONE';

  // D. Normalize
  const normalised = normalizeMovements(rawMovements, detection.bank_code, fileName);

  // E. Validate
  const validated = validateMovements(normalised);

  // F. Classify
  const classified = classifyMovements(validated);

  // G. Libro Diario
  const libro_diario = generateLibroDiario(classified, accountPlanConfig);

  // Build observations list
  const observations: string[] = [];
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
export async function previewExtract(
  input: Omit<ProcessInput, 'accountPlanConfig'>,
): Promise<Pick<ProcessResult,
  'bank_code' | 'bank_name' | 'detector_confidence' | 'extraction_method' |
  'movements' | 'classified_movements' | 'observations' | 'review_required_count'
>> {
  const result = await processExtract(input);
  return {
    bank_code:             result.bank_code,
    bank_name:             result.bank_name,
    detector_confidence:   result.detector_confidence,
    extraction_method:     result.extraction_method,
    movements:             result.movements,
    classified_movements:  result.classified_movements,
    observations:          result.observations,
    review_required_count: result.review_required_count,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildResumen(validated: ValidatedMovement[]): ProcessResumen {
  let total_debitos = 0;
  let total_creditos = 0;
  let validos = 0;
  let dudosos = 0;
  let invalidos = 0;

  for (const m of validated) {
    total_debitos  += m.debito;
    total_creditos += m.credito;
    if (m.validation_status === 'valid')   validos++;
    if (m.validation_status === 'doubtful') dudosos++;
    if (m.validation_status === 'invalid') invalidos++;
  }

  const saldo_inicial = validated.length > 0
    ? round2(validated[0].saldo - validated[0].credito + validated[0].debito)
    : 0;
  const saldo_final = validated.length > 0
    ? validated[validated.length - 1].saldo
    : 0;

  return {
    total_movimientos: validated.length,
    validos,
    dudosos,
    invalidos,
    total_debitos:  round2(total_debitos),
    total_creditos: round2(total_creditos),
    saldo_inicial,
    saldo_final,
  };
}
