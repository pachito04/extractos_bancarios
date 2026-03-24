/**
 * Base utilities shared by all bank parsers.
 * No n8n-specific code here — pure functions only.
 */
/**
 * Parse an Argentine-formatted amount string to a float.
 * Input examples: "1.234,56"  "234,56"  "1234.56"
 * Handles negative sign prefix/suffix.
 */
export declare function parseAmount(raw: string | number): number;
/**
 * Format a number in Argentine style: thousands separated by dots, decimal comma.
 * Example: 1234567.89 → "1.234.567,89"
 */
export declare function formatArgentino(n: number): string;
/** Round to 2 decimal places to avoid float drift */
export declare function round2(n: number): number;
/**
 * Normalise any date variant to DD/MM/YYYY.
 * Handles:
 *   DD/MM/YY     → DD/MM/20YY
 *   DD/MM/YYYY   → unchanged
 *   DD-MONTHNAME → DD/MM/currentYear  (Galicia Más format)
 *   DD-MM-YYYY   → DD/MM/YYYY
 */
export declare function normalizeDate(raw: string): string;
/**
 * Clean up a description string: collapse whitespace, remove doc-number noise.
 */
export declare function cleanDesc(raw: string): string;
/**
 * Return true if the string looks like a valid Argentine monetary amount.
 */
export declare function isAmount(s: string): boolean;
/**
 * Compute debito/credito from the delta between two consecutive saldo values.
 * Returns { debito, credito } as positive numbers.
 */
export declare function deltaDC(saldoActual: number, saldoAnterior: number): {
    debito: number;
    credito: number;
};
//# sourceMappingURL=base-parser.d.ts.map