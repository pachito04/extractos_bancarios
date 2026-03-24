"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MunicipalParser = void 0;
const base_parser_1 = require("./base-parser");
// Date may be immediately followed by comprobante digits — capture the whole rest
const RE_FECHA = /^(\d{2}\/\d{2}\/\d{4})(.*)/;
const RE_SALDO_ANTERIOR = /[Ss]aldo\s+(?:resumen\s+anterior|anterior)[^\d]*([\d]{1,3}(?:\.[\d]{3})*,\d{2})/i;
const RE_AMOUNT_GLOBAL = /\d{1,3}(?:\.\d{3})*,\d{2}/g;
const SKIP_PATTERNS = [
    /^Resumen de Cuenta/i, /^Sucursal/i, /^San Mart/i, /^CONCEPTO INEX/i,
    /^MORENO/i, /^\( 2\d{3} \)/i, /^Santa Fe/i, /^Clasificacion/i,
    /^CUIT/i, /^Condicion/i, /^N\u00b0 Cuenta/i, /^Integrantes/i,
    /^N\u00b0CBU/i, /^HOJA Nro/i, /^FechaComprobante/i, /^Saldo resumen/i,
    /^SALDO ANTERIOR/i, /^SALDO FINAL/i, /^TOTALES/i, /^Pagina/i,
    /^_+$/, /^\d{6,}$/,
];
function shouldSkip(line) {
    return !line.trim() || SKIP_PATTERNS.some((re) => re.test(line));
}
exports.MunicipalParser = {
    bankCode: 'BANCO_MUNICIPAL',
    parse(rawText) {
        const lines = rawText.split('\n');
        let saldoAnterior = 0;
        // Find saldo anterior
        const m0 = rawText.match(RE_SALDO_ANTERIOR);
        if (m0)
            saldoAnterior = (0, base_parser_1.parseAmount)(m0[1]);
        const movements = [];
        let i = 0;
        while (i < lines.length) {
            const line = lines[i].trim();
            if (shouldSkip(line)) {
                i++;
                continue;
            }
            const fechaMatch = line.match(RE_FECHA);
            if (!fechaMatch) {
                i++;
                continue;
            }
            const fecha = (0, base_parser_1.normalizeDate)(fechaMatch[1]);
            // Gather this line + possible continuation lines until next date or skip
            let content = fechaMatch[2] ?? '';
            let j = i + 1;
            while (j < lines.length) {
                const next = lines[j].trim();
                if (!next) {
                    j++;
                    continue;
                }
                if (RE_FECHA.test(next) || shouldSkip(next))
                    break;
                // If continuation line contains amounts OR text, append it
                content += ' ' + next;
                j++;
                // Stop once we find amounts (saldo will be last)
                RE_AMOUNT_GLOBAL.lastIndex = 0;
                const amts = content.match(RE_AMOUNT_GLOBAL);
                if (amts && amts.length >= 1)
                    break;
            }
            // Extract all amounts
            RE_AMOUNT_GLOBAL.lastIndex = 0;
            const amounts = [];
            let m;
            while ((m = RE_AMOUNT_GLOBAL.exec(content)) !== null)
                amounts.push(m[0]);
            if (amounts.length === 0) {
                i = j;
                continue;
            }
            const saldo = (0, base_parser_1.parseAmount)(amounts[amounts.length - 1]);
            // Description: remove amounts from content
            let desc = content;
            for (const amt of amounts)
                desc = desc.replace(amt, '');
            // Remove leading comprobante number pattern like "24021" or "232013"
            desc = desc.replace(/^\d{4,8}/, '').trim();
            const { debito, credito } = (0, base_parser_1.deltaDC)(saldo, saldoAnterior);
            movements.push({
                fecha,
                descripcion: (0, base_parser_1.cleanDesc)(desc),
                debito,
                credito,
                saldo,
                source_method: 'saldo_delta',
            });
            saldoAnterior = saldo;
            i = j;
        }
        return movements;
    },
};
//# sourceMappingURL=municipal.js.map