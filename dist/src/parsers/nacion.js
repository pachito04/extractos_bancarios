"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NacionParser = void 0;
const base_parser_1 = require("./base-parser");
const RE_FECHA = /^(\d{2}\/\d{2}\/\d{2})\s+(.+)$/;
const RE_SALDO_ANTERIOR = /SALDO\s+ANTERIOR[\s\S]*?([\d]{1,3}(?:\.[\d]{3})*,\d{2})/i;
const RE_SALDO_FINAL = /SALDO\s+FINAL/i;
// Extract Argentine monetary amounts from anywhere in the string
const RE_AMOUNT_GLOBAL = /\d{1,3}(?:\.\d{3})*,\d{2}/g;
exports.NacionParser = {
    bankCode: 'BANCO_NACION',
    parse(rawText) {
        const lines = rawText.split('\n');
        const movements = [];
        // Find saldo anterior
        let saldoAnterior = 0;
        const m0 = rawText.match(RE_SALDO_ANTERIOR);
        if (m0)
            saldoAnterior = (0, base_parser_1.parseAmount)(m0[1]);
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (line.length < 10)
                continue;
            if (RE_SALDO_FINAL.test(line))
                continue;
            const match = line.match(RE_FECHA);
            if (!match)
                continue;
            const fecha = match[1];
            const resto = match[2].trim();
            // Extract all amounts from the rest of the line
            RE_AMOUNT_GLOBAL.lastIndex = 0;
            const amounts = [];
            let m;
            while ((m = RE_AMOUNT_GLOBAL.exec(resto)) !== null) {
                amounts.push(m[0]);
            }
            if (amounts.length === 0)
                continue;
            const saldoStr = amounts[amounts.length - 1];
            const saldo = (0, base_parser_1.parseAmount)(saldoStr);
            // Description: remove all amounts from the rest string
            let desc = resto;
            for (const amt of amounts)
                desc = desc.replace(amt, '');
            const { debito, credito } = (0, base_parser_1.deltaDC)(saldo, saldoAnterior);
            movements.push({
                fecha: (0, base_parser_1.normalizeDate)(fecha),
                descripcion: (0, base_parser_1.cleanDesc)(desc),
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
//# sourceMappingURL=nacion.js.map