"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SantanderParser = void 0;
const base_parser_1 = require("./base-parser");
const RE_FECHA = /^(\d{2}\/\d{2}\/\d{2,4})\s+/;
const RE_SALDO_INICIAL = /[Ss]aldo\s+(?:[Ii]nicial|[Aa]nterior)[^\d\-]*([\d\.,]+)/;
const RE_MONTO = /(-?\$?\s*[\d\.]+,\d{2})/g;
const RE_IGNORAR = /^(Fecha\s+Comprobante|Saldo total|Cuenta Corriente|Periodo|Emisi|Desde:|Hasta:|CBU:|Acuerdo:|Movimientos en|Tipo de impuesto|Totales de|Total ret|Importe suscept|\d+\s*-\s*\d+|Banco Santander|CUIT:|RESPONSABLE|Cambio de com)/i;
function parseMonto(s) {
    if (!s)
        return null;
    const clean = s.replace(/\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
}
function formatFecha(s) {
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
    if (!m)
        return s;
    const yy = m[3].length === 4 ? m[3].slice(2) : m[3];
    return (0, base_parser_1.normalizeDate)(`${m[1]}/${m[2]}/${yy}`);
}
exports.SantanderParser = {
    bankCode: 'BANCO_SANTANDER',
    parse(rawText) {
        let saldoAnterior = null;
        const m0 = rawText.match(RE_SALDO_INICIAL);
        if (m0)
            saldoAnterior = parseMonto(m0[1]);
        const lines = rawText.split('\n');
        const bloques = [];
        let bloqueActual = null;
        for (const rawLine of lines) {
            const trimmed = rawLine.trim();
            if (!trimmed || RE_IGNORAR.test(trimmed))
                continue;
            const matchFecha = trimmed.match(RE_FECHA);
            if (matchFecha) {
                if (bloqueActual)
                    bloques.push(bloqueActual);
                bloqueActual = { fecha: matchFecha[1], lineas: [trimmed] };
            }
            else if (bloqueActual) {
                bloqueActual.lineas.push(trimmed);
            }
        }
        if (bloqueActual)
            bloques.push(bloqueActual);
        const movements = [];
        for (const bloque of bloques) {
            const texto = bloque.lineas.join(' ');
            const allMatches = [...texto.matchAll(RE_MONTO)];
            if (allMatches.length === 0)
                continue;
            const saldoStr = allMatches[allMatches.length - 1][1];
            const saldoActual = parseMonto(saldoStr);
            if (saldoActual === null)
                continue;
            let { debito, credito } = { debito: 0, credito: 0 };
            if (saldoAnterior !== null) {
                const r = (0, base_parser_1.deltaDC)(saldoActual, saldoAnterior);
                debito = r.debito;
                credito = r.credito;
            }
            let desc = texto
                .replace(RE_FECHA, '')
                .replace(saldoStr, '')
                .replace(/\s{2,}/g, ' ')
                .trim();
            movements.push({
                fecha: formatFecha(bloque.fecha),
                descripcion: (0, base_parser_1.cleanDesc)(desc),
                debito,
                credito,
                saldo: saldoActual,
                source_method: 'saldo_delta',
            });
            saldoAnterior = saldoActual;
        }
        return movements;
    },
};
//# sourceMappingURL=santander.js.map