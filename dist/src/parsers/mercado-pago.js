"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoPagoParser = void 0;
const base_parser_1 = require("./base-parser");
const RE_SALDO_INICIAL = /Saldo\s+inicial:\s*\$\s*([\d.,]+)/i;
// DD-MM-YYYY description idOperacion $ valor $ saldo
const RE_MOVIMIENTO = /(\d{2}-\d{2}-\d{4})\s+(.*?)\s+(\d+)\s+\$\s*([-]?[\d.,]+)\s+\$\s*([\d.,]+)/g;
exports.MercadoPagoParser = {
    bankCode: 'MERCADO_PAGO',
    parse(rawText) {
        let saldoAnterior = 0;
        const m0 = rawText.match(RE_SALDO_INICIAL);
        if (m0)
            saldoAnterior = (0, base_parser_1.parseAmount)(m0[1]);
        const movements = [];
        let match;
        RE_MOVIMIENTO.lastIndex = 0;
        while ((match = RE_MOVIMIENTO.exec(rawText)) !== null) {
            const fechaRaw = match[1]; // DD-MM-YYYY
            const descripcion = match[2].trim();
            const saldo = (0, base_parser_1.parseAmount)(match[5]);
            const { debito, credito } = (0, base_parser_1.deltaDC)(saldo, saldoAnterior);
            movements.push({
                fecha: (0, base_parser_1.normalizeDate)(fechaRaw),
                descripcion: (0, base_parser_1.cleanDesc)(descripcion),
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
//# sourceMappingURL=mercado-pago.js.map