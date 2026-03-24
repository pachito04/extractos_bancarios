/**
 * Base utilities shared by all bank parsers.
 * No n8n-specific code here — pure functions only.
 */

// ---------------------------------------------------------------------------
// Amount helpers
// ---------------------------------------------------------------------------

/**
 * Parse an Argentine-formatted amount string to a float.
 * Input examples: "1.234,56"  "234,56"  "1234.56"
 * Handles negative sign prefix/suffix.
 */
export function parseAmount(raw: string | number): number {
  if (typeof raw === 'number') return raw;
  if (!raw || raw.trim() === '' || raw === '-') return 0;

  let s = raw.trim();
  const negative = s.startsWith('-') || s.endsWith('-');
  s = s.replace(/-/g, '').trim();

  // Argentine format: dots are thousands separators, comma is decimal
  // Detect by checking whether the last separator is a comma
  if (s.includes(',')) {
    // Remove dots (thousands), comma → decimal point
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    // Only dots — treat as plain number
    s = s.replace(/\./g, '');
  }

  const num = parseFloat(s) || 0;
  return negative ? -Math.abs(num) : num;
}

/**
 * Format a number in Argentine style: thousands separated by dots, decimal comma.
 * Example: 1234567.89 → "1.234.567,89"
 */
export function formatArgentino(n: number): string {
  if (n === 0) return '0,00';
  const rounded = Math.round(n * 100) / 100;
  const [int, dec] = rounded.toFixed(2).split('.');
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intFormatted},${dec}`;
}

/** Round to 2 decimal places to avoid float drift */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const MONTH_MAP: Record<string, string> = {
  ENE: '01', FEB: '02', MAR: '03', ABR: '04',
  MAY: '05', JUN: '06', JUL: '07', AGO: '08',
  SEP: '09', OCT: '10', NOV: '11', DIC: '12',
};

/**
 * Normalise any date variant to DD/MM/YYYY.
 * Handles:
 *   DD/MM/YY     → DD/MM/20YY
 *   DD/MM/YYYY   → unchanged
 *   DD-MONTHNAME → DD/MM/currentYear  (Galicia Más format)
 *   DD-MM-YYYY   → DD/MM/YYYY
 */
export function normalizeDate(raw: string): string {
  if (!raw) return '';
  const s = raw.trim();

  // Already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  // DD/MM/YY
  const shortMatch = s.match(/^(\d{2}\/\d{2}\/)(\d{2})$/);
  if (shortMatch) return `${shortMatch[1]}20${shortMatch[2]}`;

  // DD-MONTHNAME (Galicia Más: "1-ENE", "15-DIC")
  const nameMatch = s.match(/^(\d{1,2})-(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)$/i);
  if (nameMatch) {
    const day = nameMatch[1].padStart(2, '0');
    const month = MONTH_MAP[nameMatch[2].toUpperCase()];
    const year = new Date().getFullYear();
    return `${day}/${month}/${year}`;
  }

  // DD-MM-YYYY (Mercado Pago)
  const dashMatch = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dashMatch) return `${dashMatch[1]}/${dashMatch[2]}/${dashMatch[3]}`;

  // DD-MM-YYYY where year is 2-digit
  const dashShort = s.match(/^(\d{2})-(\d{2})-(\d{2})$/);
  if (dashShort) return `${dashShort[1]}/${dashShort[2]}/20${dashShort[3]}`;

  return s; // return as-is — validator will flag it
}

// ---------------------------------------------------------------------------
// Description helpers
// ---------------------------------------------------------------------------

/**
 * Clean up a description string: collapse whitespace, remove doc-number noise.
 */
export function cleanDesc(raw: string): string {
  return String(raw ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\d{14,}H/g, '')
    .replace(/Pagina \d+ \/ \d+/gi, '')
    .replace(/Página \d+ \/ \d+/gi, '')
    .trim();
}

// ---------------------------------------------------------------------------
// Shared parsing helpers
// ---------------------------------------------------------------------------

/**
 * Return true if the string looks like a valid Argentine monetary amount.
 */
export function isAmount(s: string): boolean {
  return /^-?[\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{2})?$/.test(s.trim())
    || /^-?[\d]+,\d{2}$/.test(s.trim());
}

/**
 * Compute debito/credito from the delta between two consecutive saldo values.
 * Returns { debito, credito } as positive numbers.
 */
export function deltaDC(saldoActual: number, saldoAnterior: number): { debito: number; credito: number } {
  const diff = round2(saldoActual - saldoAnterior);
  if (diff > 0.01)  return { debito: 0,           credito: round2(diff) };
  if (diff < -0.01) return { debito: round2(-diff), credito: 0 };
  return { debito: 0, credito: 0 };
}
