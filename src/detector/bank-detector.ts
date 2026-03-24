import type { BankDetectionResult } from '../types';

// ---------------------------------------------------------------------------
// Bank name map
// ---------------------------------------------------------------------------

const BANK_NAMES: Record<string, string> = {
  BANCO_NACION:       'Banco de la Nación Argentina',
  BANCO_GALICIA:      'Banco Galicia',
  BANCO_GALICIA_MAS:  'Banco Galicia Más',
  BANCO_CREDICOOP:    'Banco Credicoop',
  BANCO_MACRO:        'Banco Macro',
  BANCO_SANTA_FE:     'Nuevo Banco de Santa Fe',
  BANCO_CONAIG:       'Banco Conaig',
  MERCADO_PAGO:       'Mercado Pago',
  BANCO_SANTANDER:    'Banco Santander',
  BANCO_MUNICIPAL:    'Banco Municipal de Rosario',
  DESCONOCIDO:        'Banco desconocido',
};

// ---------------------------------------------------------------------------
// Detection patterns (pure regex, zero LLM)
// ---------------------------------------------------------------------------

type BankPatterns = Record<string, RegExp[]>;

const PATRONES: BankPatterns = {
  // Galicia Más must be checked BEFORE Galicia (more specific)
  BANCO_GALICIA_MAS: [
    /BANCO\s+GALICIA\s+MAS/,
    /GALICIA\s+MAS/,
  ],
  BANCO_NACION: [
    /BANCO\s+DE\s+LA\s+NACION\s+ARGENTINA/,
    /CUIT\s+30-50001091-2/,
    /NACION\s+ARGENTINA/,
    /\bBNA\b/,
  ],
  BANCO_GALICIA: [
    /BANCO\s+GALICIA(?!\s+MAS)/,
    /GALICIA\s+Y\s+BUENOS\s+AIRES/,
    /CUIT\s+30-50000125-6/,
  ],
  BANCO_CREDICOOP: [
    /BANCO\s+CREDICOOP/,
    /CREDICOOP\s+COOPERATIVO\s+LIMITADO/,
    /CUIT\s+30-50000019-8/,
  ],
  BANCO_MACRO: [
    /BANCO\s+MACRO/,
    /\bMACRO\s+S\.?A\.?/,
    /CUIT\s+30-50001008-4/,
  ],
  BANCO_SANTA_FE: [
    /BANCO\s+SANTA\s+FE/,
    /NUEVO\s+BANCO\s+DE\s+SANTA\s+FE/,
    /CUIT\s+30-50004146-0/,
  ],
  BANCO_CONAIG: [
    /BANCO\s+CONAIG/,
    /\bCONAIG\b/,
  ],
  MERCADO_PAGO: [
    /MERCADO\s+PAGO/,
    /\bMERCADOPAGO\b/,
    /CUIT\s+30-71380561-3/,
  ],
  BANCO_SANTANDER: [
    /BANCO\s+SANTANDER/,
    /SANTANDER\s+RIO/,
    /SANTANDER\s+ARGENTINA/,
    /CUIT\s+30-52043323-0/,
  ],
  BANCO_MUNICIPAL: [
    /BANCO\s+MUNICIPAL\s+DE\s+ROSARIO/,
    /BANCO\s+MUNICIPAL/,
    /CUIT\s+30-99903208-7/,
    // Unique phrases in Municipal de Rosario PDFs (pdf-parse output)
    /SALDO\s+RESUMEN\s+ANTERIOR\s+AL/,
    /CBU[:\s]+065002070/,   // CBU prefix for Banco Municipal Rosario
  ],
};

// ---------------------------------------------------------------------------
// Normalise text for pattern matching (uppercase, no diacritics)
// ---------------------------------------------------------------------------

function normalise(text: string): string {
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ---------------------------------------------------------------------------
// Count matches — used to compute confidence
// ---------------------------------------------------------------------------

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.filter((re) => re.test(text)).length;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect the bank from the normalised raw text of a bank statement.
 * Returns a BankDetectionResult with bank_code, bank_name, confidence (0-1)
 * and the parser_strategy to use.
 */
export function detectBank(rawText: string): BankDetectionResult {
  const normalised = normalise(rawText);

  let bestBank = 'DESCONOCIDO';
  let bestMatches = 0;

  // Iterate in declaration order — GALICIA_MAS is first, which is correct
  for (const [bankCode, patterns] of Object.entries(PATRONES)) {
    const matches = countMatches(normalised, patterns);
    if (matches > bestMatches) {
      bestMatches = matches;
      bestBank = bankCode;
    }
  }

  const totalPatterns = PATRONES[bestBank]?.length ?? 1;
  const confidence = bestBank === 'DESCONOCIDO'
    ? 0
    : Math.min(1, bestMatches / totalPatterns);

  return {
    bank_code: bestBank,
    bank_name: BANK_NAMES[bestBank] ?? bestBank,
    confidence,
    parser_strategy: bestBank.toLowerCase().replace(/_/g, '-'),
  };
}
