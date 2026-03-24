import type { IParser, RawMovement } from '../types';
import { parseAmount, cleanDesc, normalizeDate, deltaDC } from './base-parser';

const RE_FECHA = /^(\d{2}\/\d{2}\/\d{2})\s+(.+)/;
const RE_SALDO_ANTERIOR = /SALDO\s+ULTIMO\s+EXTRACTO\s+AL\s+\d{2}\/\d{2}\/\d{4}\s+([-]?[\d.,]+)/i;
const RE_NUMBER = /^[-]?[\d.,]+$/;

const SKIP_PATTERNS = [
  /^Los depositos en pesos/i, /^el total de la garantia/i, /^El presente extracto/i,
  /^conformidad con el movimiento/i, /^Si su condicion/i, /^El plazo de compensacion/i,
  /^Usted puede solicitar/i, /^Usted puede consultar/i, /^Ante cualquier consulta/i,
  /^Acerquese a su Sucursal/i, /^Comuniquese con Banelco/i, /^Banco Macro S\.A\./i,
  /^Sucursal \d+/i, /^Ovidio Lagos/i, /^Sr\(es\):/i, /^ENTRE RIOS/i, /^CP:/i,
  /^SANTA FE/i, /^ROSARIO/i, /^C\.U\.I\.T/i, /^Cantidad Titulares/i,
  /^Resumen General/i, /^Periodo del Extracto/i, /^Saldos consolidados/i,
  /^Saldo Cuentas/i, /^Informacion de su\/s Cuenta\/s/i, /^CUENTA CORRIENTE/i,
  /^Clave Bancaria/i, /^Tasa Nom\./i, /^DETALLE DE MOVIMIENTO/i,
  /^FECHA\s+DESCRIPCION/i, /^Hoja Nro\./i, /^- - - - -/i, /^Ley 24\.485/i,
  /modificatorias y complementarias/i, /^Se encuentran excluidos/i,
  /por personas vinculadas/i, /^vigente y sin modificacion/i, /^Desde el \d{2}\/\d{2}/i,
  /^aplican las sig\. Comis/i, /I\.V\.A\. Responsable Inscripto/i, /Ingresos Brutos:/i,
];

function shouldSkip(line: string): boolean {
  return !line.trim() || SKIP_PATTERNS.some((re) => re.test(line));
}

export const MacroParser: IParser = {
  bankCode: 'BANCO_MACRO',

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
        let lineaCompleta = matchFecha[2].trim();

        // Gather continuation lines until next date or skip line
        let j = i + 1;
        while (j < lines.length && !lines[j].match(RE_FECHA)) {
          const next = lines[j].trim();
          if (!next || shouldSkip(next)) { j++; break; }
          lineaCompleta += ' ' + next;
          if (RE_NUMBER.test(next)) { j++; break; }
          j++;
        }

        const parts = lineaCompleta.split(/\s+/);

        // Find saldo: last numeric token
        let saldoActual: number | null = null;
        let trailingNums = 0;
        for (let k = parts.length - 1; k >= 0; k--) {
          if (RE_NUMBER.test(parts[k])) {
            trailingNums++;
            if (saldoActual === null) saldoActual = parseAmount(parts[k]);
          } else break;
        }

        if (saldoActual !== null) {
          const toRemove = Math.min(3, trailingNums);
          const desc = parts.slice(0, parts.length - toRemove).join(' ');

          const { debito, credito } = deltaDC(saldoActual, saldoAnterior);
          movements.push({
            fecha,
            descripcion: cleanDesc(desc),
            debito,
            credito,
            saldo: saldoActual,
            source_method: 'saldo_delta',
          });
          saldoAnterior = saldoActual;
        }

        i = j > i ? j : i + 1;
      } else {
        i++;
      }
    }

    return movements;
  },
};
