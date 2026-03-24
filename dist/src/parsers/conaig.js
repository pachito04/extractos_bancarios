"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConaigParser = void 0;
const base_parser_1 = require("./base-parser");
const RE_FECHA = /^\d{2}\/\d{2}\/\d{4}/;
const RE_SALDO_ANTERIOR = /Saldo Ant\.?:?\s*([\d.,]+)/i;
// Two amounts at start of line (after date is stripped): saldo + importe
const RE_DOS_MONTOS = /^(-?\d{1,3}(?:\.\d{3})*,\d{2})(-?\d{1,3}(?:\.\d{3})*,\d{2})/;
const SKIP_PATTERNS = [
    /ANYFIG SRL/, /CUENTA CORRIENTE/, /IVA: RESPONSABLE INSCRIPTO/,
    /Cliente N/, /Periodo:/, /CBU:/, /CUIT:/,
    /^Pag\./, /^Transporte/, /^Detalle de Tributos/,
    /^Los plazos fijos/, /^En ningun caso/, /^Se encuentran excluidos/,
    /^RECLAMOS:/, /^IMPUESTOS LEY/, /^DEBITOS AUTOMATICOS/,
    /^INFORMACION AL USUARIO/, /^Usted puede/, /^Si hubiera pactado/,
    /^Ante cualquier consulta/, /^Asimismo/, /^Se sugiere/, /^Las devoluciones/,
    /^Total:/, /^a fin de comparar/, /^de cancelacion/, /^de pago del cierre/,
    /Saldo.*Concepto/,
];
function shouldSkip(line) {
    return !line.trim() || SKIP_PATTERNS.some((re) => re.test(line));
}
exports.ConaigParser = {
    bankCode: 'BANCO_CONAIG',
    parse(rawText) {
        const lines = rawText.split('\n');
        let saldoAnterior = 0;
        const m0 = rawText.match(RE_SALDO_ANTERIOR);
        if (m0)
            saldoAnterior = (0, base_parser_1.parseAmount)(m0[1]);
        const movements = [];
        let fechaActual = '';
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line)
                continue;
            if (shouldSkip(line))
                continue;
            if (RE_FECHA.test(line)) {
                fechaActual = line.substring(0, 10);
                line = line.substring(10).trim();
            }
            const match = line.match(RE_DOS_MONTOS);
            if (match && fechaActual) {
                const saldo = (0, base_parser_1.parseAmount)(match[1]);
                // Look ahead one line for description
                let descripcion = '';
                if (i + 1 < lines.length) {
                    const next = lines[i + 1].trim();
                    if (next && !shouldSkip(next) && !RE_FECHA.test(next) && !RE_DOS_MONTOS.test(next)) {
                        descripcion = next;
                    }
                }
                const { debito, credito } = (0, base_parser_1.deltaDC)(saldo, saldoAnterior);
                movements.push({
                    fecha: (0, base_parser_1.normalizeDate)(fechaActual),
                    descripcion: (0, base_parser_1.cleanDesc)(descripcion || '-'),
                    debito,
                    credito,
                    saldo,
                    source_method: 'saldo_delta',
                });
                saldoAnterior = saldo;
            }
        }
        return movements;
    },
};
//# sourceMappingURL=conaig.js.map