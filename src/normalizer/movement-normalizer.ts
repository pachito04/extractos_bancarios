import type { RawMovement, NormalizedMovement } from '../types';
import { parseAmount, normalizeDate, cleanDesc, round2 } from '../parsers/base-parser';

let batchCounter = 0;

function generateBatchId(fileName: string): string {
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
export function normalizeMovements(
  raw: RawMovement[],
  bankCode: string,
  fileName: string,
): NormalizedMovement[] {
  const batchId = generateBatchId(fileName);

  return raw.map((r) => {
    const debito  = round2(typeof r.debito  === 'number' ? r.debito  : parseAmount(r.debito  as unknown as string));
    const credito = round2(typeof r.credito === 'number' ? r.credito : parseAmount(r.credito as unknown as string));
    const saldo   = round2(typeof r.saldo   === 'number' ? r.saldo   : parseAmount(r.saldo   as unknown as string));
    const fecha   = normalizeDate(r.fecha ?? '');
    const descripcion = cleanDesc(r.descripcion ?? '');

    // Confidence: column_parse is inherently more reliable than delta inference
    const confidence: 'high' | 'medium' | 'low' =
      r.source_method === 'column_parse'   ? 'high'   :
      r.source_method === 'saldo_delta'    ? 'medium' :
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
