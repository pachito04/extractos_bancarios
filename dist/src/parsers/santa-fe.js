"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SantaFeParser = void 0;
const base_parser_1 = require("./base-parser");
const RE_FECHA = /^(\d{2}\/\d{2}\/\d{4})\s+(.+)/;
const RE_SALDO_ANTERIOR = /SALDO\s+ULTIMO\s+RESUMEN:\s*([\d.,]+)/i;
const RE_SOLO_NUM = /^[\d.,]+$/;
exports.SantaFeParser = {
    bankCode: 'BANCO_SANTA_FE',
    parse(rawText) {
        const lines = rawText.split('\n');
        let saldoAnterior = 0;
        const m0 = rawText.match(RE_SALDO_ANTERIOR);
        if (m0)
            saldoAnterior = (0, base_parser_1.parseAmount)(m0[1]);
        const movements = [];
        let i = 0;
        while (i < lines.length) {
            const line = lines[i].trim();
            const matchFecha = line.match(RE_FECHA);
            if (matchFecha) {
                const fecha = (0, base_parser_1.normalizeDate)(matchFecha[1]);
                const resto = matchFecha[2].trim();
                const parts = resto.split(/\s+/);
                const ultimaParte = parts[parts.length - 1];
                let saldoActual = null;
                let lineaCompleta;
                if (RE_SOLO_NUM.test(ultimaParte)) {
                    saldoActual = (0, base_parser_1.parseAmount)(ultimaParte);
                    lineaCompleta = parts.slice(0, -1).join(' ');
                    i++;
                }
                else {
                    // Saldo is on a following line
                    lineaCompleta = resto;
                    let j = i + 1;
                    while (j < lines.length && !lines[j].match(RE_FECHA)) {
                        const next = lines[j].trim();
                        if (!next) {
                            j++;
                            continue;
                        }
                        if (RE_SOLO_NUM.test(next)) {
                            saldoActual = (0, base_parser_1.parseAmount)(next);
                            j++;
                            break;
                        }
                        lineaCompleta += ' ' + next;
                        j++;
                    }
                    i = j;
                }
                if (saldoActual !== null) {
                    const { debito, credito } = (0, base_parser_1.deltaDC)(saldoActual, saldoAnterior);
                    movements.push({
                        fecha,
                        descripcion: (0, base_parser_1.cleanDesc)(lineaCompleta),
                        debito,
                        credito,
                        saldo: saldoActual,
                        source_method: 'saldo_delta',
                    });
                    saldoAnterior = saldoActual;
                }
            }
            else {
                i++;
            }
        }
        return movements;
    },
};
//# sourceMappingURL=santa-fe.js.map