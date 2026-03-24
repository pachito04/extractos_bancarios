import type { IParser, RawMovement } from '../types';
import { parseAmount, cleanDesc, normalizeDate, deltaDC } from './base-parser';

const RE_SALDO_INICIAL = /Saldo\s+inicial:\s*\$\s*([\d.,]+)/i;
// DD-MM-YYYY description idOperacion $ valor $ saldo
const RE_MOVIMIENTO = /(\d{2}-\d{2}-\d{4})\s+(.*?)\s+(\d+)\s+\$\s*([-]?[\d.,]+)\s+\$\s*([\d.,]+)/g;

export const MercadoPagoParser: IParser = {
  bankCode: 'MERCADO_PAGO',

  parse(rawText: string): RawMovement[] {
    let saldoAnterior = 0;

    const m0 = rawText.match(RE_SALDO_INICIAL);
    if (m0) saldoAnterior = parseAmount(m0[1]);

    const movements: RawMovement[] = [];
    let match: RegExpExecArray | null;
    RE_MOVIMIENTO.lastIndex = 0;

    while ((match = RE_MOVIMIENTO.exec(rawText)) !== null) {
      const fechaRaw = match[1]; // DD-MM-YYYY
      const descripcion = match[2].trim();
      const saldo = parseAmount(match[5]);

      const { debito, credito } = deltaDC(saldo, saldoAnterior);

      movements.push({
        fecha: normalizeDate(fechaRaw),
        descripcion: cleanDesc(descripcion),
        debito,
        credito,
        saldo,
        source_method: 'saldo_delta',
      });

      saldoAnterior = saldo;
    }

    return movements;
  },
};
