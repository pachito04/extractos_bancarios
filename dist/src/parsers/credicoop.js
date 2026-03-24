"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredicoopParser = void 0;
const base_parser_1 = require("./base-parser");
const RE_FECHA = /(\d{2})\/(\d{2})\/(\d{2})/;
const RE_SALDO_LINE = /(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/;
const SKIP_PATTERNS = [
    /PAGINA/i, /^BANCO/i, /FECHA.*DESCRIPCION/i,
    />>>/, /CONTINUA EN/i, /VIENE DE/i,
    /Cuenta Corriente/i, /^CBU/i, /Ctro\. de Contacto/i,
];
function shouldSkip(line) {
    return !line.trim() || SKIP_PATTERNS.some((re) => re.test(line));
}
exports.CredicoopParser = {
    bankCode: 'BANCO_CREDICOOP',
    parse(rawText) {
        const lines = rawText.split('\n');
        let saldoAnterior = 0;
        // Find saldo anterior
        for (const line of lines) {
            if (line.includes('SALDO ANTERIOR')) {
                const m = line.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/);
                if (m) {
                    saldoAnterior = (0, base_parser_1.parseAmount)(m[1]);
                    break;
                }
            }
        }
        const movements = [];
        let currentMovement = null;
        let currentDesc = '';
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (shouldSkip(line))
                continue;
            const fechaMatch = line.match(RE_FECHA);
            if (fechaMatch) {
                // Flush previous
                if (currentMovement) {
                    const { debito, credito } = (0, base_parser_1.deltaDC)(currentMovement.saldo, saldoAnterior);
                    movements.push({
                        fecha: currentMovement.fecha,
                        descripcion: (0, base_parser_1.cleanDesc)(currentDesc),
                        debito,
                        credito,
                        saldo: currentMovement.saldo,
                        source_method: 'saldo_delta',
                    });
                    saldoAnterior = currentMovement.saldo;
                }
                const saldoMatch = line.match(RE_SALDO_LINE);
                if (!saldoMatch) {
                    currentMovement = null;
                    continue;
                }
                const saldoActual = (0, base_parser_1.parseAmount)(saldoMatch[1]);
                const fecha = (0, base_parser_1.normalizeDate)(fechaMatch[0]);
                // Extract description: remove date + saldo from line
                const descMatch = line.match(/\d{2}\/\d{2}\/\d{2}\s+(\d+)?\s*(.+?)\s+\d{1,3}(?:\.\d{3})*,\d{2}\s*$/);
                currentDesc = descMatch ? descMatch[2].trim() : '';
                currentMovement = { fecha, saldo: saldoActual };
            }
            else if (currentMovement) {
                currentDesc += ' ' + line;
            }
        }
        // Flush last
        if (currentMovement) {
            const { debito, credito } = (0, base_parser_1.deltaDC)(currentMovement.saldo, saldoAnterior);
            movements.push({
                fecha: currentMovement.fecha,
                descripcion: (0, base_parser_1.cleanDesc)(currentDesc),
                debito,
                credito,
                saldo: currentMovement.saldo,
                source_method: 'saldo_delta',
            });
        }
        return movements;
    },
};
//# sourceMappingURL=credicoop.js.map