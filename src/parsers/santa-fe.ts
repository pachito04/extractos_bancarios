import type { IParser, RawMovement } from '../types';
import { parseAmount, cleanDesc, normalizeDate, deltaDC } from './base-parser';

const RE_FECHA = /^(\d{2}\/\d{2}\/\d{4})\s+(.+)/;
const RE_SALDO_ANTERIOR = /SALDO\s+ULTIMO\s+RESUMEN:\s*([\d.,]+)/i;
const RE_SOLO_NUM = /^[\d.,]+$/;

export const SantaFeParser: IParser = {
  bankCode: 'BANCO_SANTA_FE',

  parse(rawText: string): RawMovement[] {
    const lines = rawText.split('\n');
    let saldoAnterior = 0;

    const m0 = rawText.match(RE_SALDO_ANTERIOR);
    if (m0) saldoAnterior = parseAmount(m0[1]);

    const movements: RawMovement[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      const matchFecha = line.match(RE_FECHA);

      if (matchFecha) {
        const fecha = normalizeDate(matchFecha[1]);
        const resto = matchFecha[2].trim();
        const parts = resto.split(/\s+/);
        const ultimaParte = parts[parts.length - 1];

        let saldoActual: number | null = null;
        let lineaCompleta: string;

        if (RE_SOLO_NUM.test(ultimaParte)) {
          saldoActual = parseAmount(ultimaParte);
          lineaCompleta = parts.slice(0, -1).join(' ');
          i++;
        } else {
          // Saldo is on a following line
          lineaCompleta = resto;
          let j = i + 1;
          while (j < lines.length && !lines[j].match(RE_FECHA)) {
            const next = lines[j].trim();
            if (!next) { j++; continue; }
            if (RE_SOLO_NUM.test(next)) {
              saldoActual = parseAmount(next);
              j++;
              break;
            }
            lineaCompleta += ' ' + next;
            j++;
          }
          i = j;
        }

        if (saldoActual !== null) {
          const { debito, credito } = deltaDC(saldoActual, saldoAnterior);
          movements.push({
            fecha,
            descripcion: cleanDesc(lineaCompleta),
            debito,
            credito,
            saldo: saldoActual,
            source_method: 'saldo_delta',
          });
          saldoAnterior = saldoActual;
        }
      } else {
        i++;
      }
    }

    return movements;
  },
};
