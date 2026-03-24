import type { IParser, RawMovement } from '../types';
import { parseAmount, normalizeDate } from './base-parser';

const RE_FECHA = /^(\d{2}\/\d{2}\/\d{2})\s/;
const RE_AMOUNT = /-?[\d]{1,3}(?:\.[\d]{3})*(?:,[\d]{2})?-?/g;

const SKIP_PATTERNS = [
  /Pagina/i, /Página/i, /ULTRABRILLO/, /CUIT/, /IVA.+Responsable/i,
  /Resumen de Cuenta/i, /^\d{14,}H$/, /Fecha Descripcion Origen/i,
  /^Movimientos$/, /^Total /, /Consolidado/, /PERIODO COMPRENDIDO/,
  /Los depositos en pesos/i, /Canales de atencion/i, /^Importe$/,
  /TOTAL RETENCION/, /TOTAL IMPUESTO/, /TOTAL MENSUAL/,
  /personas, la garantia/i, /bancogalicia\.com/, /Whatsapp/i,
  /Llamanos a Fonobanco/i, /Se encuentran excluidos/i,
  /Al completa esta hoja/i, /Ingresa a/i, /Usted puede consultar/i,
  /Datos de la cuenta/i, /Tipo de cuenta/i, /Numero de cuenta/i,
  /Cantidad de cotitulares/i, /^CBU/, /Periodo de movimientos/i,
  /^Saldos$/, /Dispones de/i, /Tasa Extraordinaria/i,
  /Esta cuenta esta cerrada/i,
];

function shouldSkip(line: string): boolean {
  return SKIP_PATTERNS.some((re) => re.test(line));
}

function cleanNumber(s: string): number {
  if (!s || s === '-') return 0;
  let cleaned = s.trim();
  const negative = cleaned.startsWith('-') || cleaned.endsWith('-');
  cleaned = cleaned.replace(/-/g, '');

  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '');
  } else {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }

  const num = parseFloat(cleaned) || 0;
  return negative ? -Math.abs(num) : num;
}

function parseBlock(lines: string[]): RawMovement | null {
  if (!lines || lines.length === 0) return null;

  const dateMatch = lines[0].match(/^(\d{2}\/\d{2}\/\d{2})/);
  if (!dateMatch) return null;
  const fecha = dateMatch[1];

  let fullText = lines.join(' ');

  // Remove "Total" suffix lines
  const totalIdx = fullText.indexOf('Total ');
  if (totalIdx !== -1) fullText = fullText.substring(0, totalIdx);
  if (fullText.trim().length < 20) return null;

  const allNumbers = fullText.match(RE_AMOUNT) ?? [];
  const validNumbers = allNumbers.filter((n) => {
    const clean = n.replace(/[.,\-]/g, '');
    return clean.length <= 10 || n.includes('.') || n.includes(',');
  });

  if (validNumbers.length === 0) return null;

  const saldoStr = validNumbers[validNumbers.length - 1];
  const saldo = cleanNumber(saldoStr);

  let credito = 0;
  let debito = 0;

  if (validNumbers.length >= 2) {
    const montoStr = validNumbers[validNumbers.length - 2];
    const monto = cleanNumber(montoStr);
    if (montoStr.includes('-')) {
      debito = Math.abs(monto);
    } else {
      credito = Math.abs(monto);
    }
  }

  // Build description: remove date, saldo, monto
  let desc = fullText.replace(/^\d{2}\/\d{2}\/\d{2}\s*/, '');
  const saldoPos = desc.lastIndexOf(saldoStr);
  if (saldoPos !== -1) desc = desc.substring(0, saldoPos);
  if (validNumbers.length >= 2) {
    const montoStr = validNumbers[validNumbers.length - 2];
    const montoPos = desc.lastIndexOf(montoStr);
    if (montoPos !== -1) desc = desc.substring(0, montoPos);
  }

  desc = cleanDesc(desc);
  if (desc.length < 3) return null;

  return {
    fecha: normalizeDate(fecha),
    descripcion: desc,
    debito,
    credito,
    saldo,
    source_method: 'column_parse',
  };
}

function cleanDesc(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/\d{14,}H/g, '').replace(/Pagina \d+ \/ \d+/gi, '').trim();
}

export const GaliciaParser: IParser = {
  bankCode: 'BANCO_GALICIA',

  parse(rawText: string): RawMovement[] {
    const lines = rawText.split('\n');
    const movements: RawMovement[] = [];
    let buffer: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (shouldSkip(line)) continue;

      if (RE_FECHA.test(line)) {
        if (buffer.length > 0) {
          const mov = parseBlock(buffer);
          if (mov) movements.push(mov);
        }
        buffer = [line];
      } else if (buffer.length > 0) {
        buffer.push(line);
      }
    }

    if (buffer.length > 0) {
      const mov = parseBlock(buffer);
      if (mov) movements.push(mov);
    }

    return movements;
  },
};
