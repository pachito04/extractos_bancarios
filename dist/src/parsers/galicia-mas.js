"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GaliciaMasParser = void 0;
const base_parser_1 = require("./base-parser");
const RE_FECHA_MAS = /^(\d{1,2}-(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC))/i;
const RE_FECHA_MAS_LINE = /^-\s+([A-Z])/;
const RE_AMOUNT = /\d{1,3}(?:[.,]\d{3})*[.,]\d{2}/g;
function extraerSaldoInicial(lines) {
    for (const line of lines) {
        if (line.includes('SALDO ANTERIOR')) {
            const m = line.match(/SALDO ANTERIOR\s+([0-9.,]+)/);
            if (m)
                return (0, base_parser_1.parseAmount)(m[1]);
        }
    }
    return 0;
}
function parsearLineaMovimiento(linea, fecha) {
    let contenido = linea
        .replace(/^\d{1,2}-(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s*-?\s*/i, '')
        .replace(/^-\s+/, '');
    const montos = contenido.match(RE_AMOUNT);
    if (!montos || montos.length === 0)
        return null;
    const saldoStr = montos[montos.length - 1];
    const saldo = (0, base_parser_1.parseAmount)(saldoStr);
    const monto = montos.length >= 2 ? (0, base_parser_1.parseAmount)(montos[montos.length - 2]) : 0;
    let desc = contenido;
    for (const m of montos)
        desc = desc.replace(m, '');
    desc = desc
        .replace(/\b\d{5}\b/g, '')
        .replace(/COMP BASE.+?MIL/gi, '')
        .replace(/\d{20,}/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (desc.length > 120)
        desc = desc.substring(0, 120);
    return { fecha: (0, base_parser_1.normalizeDate)(fecha), descripcion: (0, base_parser_1.cleanDesc)(desc), monto, saldo };
}
exports.GaliciaMasParser = {
    bankCode: 'BANCO_GALICIA_MAS',
    parse(rawText) {
        const lines = rawText.split('\n');
        const saldoInicial = extraerSaldoInicial(lines);
        const rawMovs = [];
        let dentroDetalle = false;
        let fechaActual = '';
        for (let i = 0; i < lines.length; i++) {
            const linea = lines[i].trim();
            if (linea === '- DETALLE DE OPERACIONES -') {
                dentroDetalle = true;
                continue;
            }
            if (!dentroDetalle)
                continue;
            if (linea === 'NO HUBO NINGUNA ACTIVIDAD DURANTE EL PERIODO DEL EXTRACTO')
                break;
            if (linea.includes('HOJA 2') || linea.includes('FECHA REFERENCIA NRO'))
                continue;
            if (linea.startsWith('- SALDO FINAL') || linea === 'SALDO FINAL')
                continue;
            if (linea.includes('NRO. PRESTAMO') || linea.includes('C/TRANSF.CAJ. COMP'))
                continue;
            const matchFecha = linea.match(RE_FECHA_MAS);
            const esGuion = RE_FECHA_MAS_LINE.test(linea);
            if (matchFecha) {
                fechaActual = matchFecha[1];
                const datos = parsearLineaMovimiento(linea, fechaActual);
                if (datos)
                    rawMovs.push(datos);
            }
            else if (esGuion && fechaActual) {
                const datos = parsearLineaMovimiento(linea, fechaActual);
                if (datos)
                    rawMovs.push(datos);
            }
        }
        // Compute debito/credito from saldo delta
        let saldoAnterior = saldoInicial;
        const movements = [];
        const seen = new Set();
        for (const mov of rawMovs) {
            const key = `${mov.fecha}|${mov.saldo}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            const { debito, credito } = (0, base_parser_1.deltaDC)(mov.saldo, saldoAnterior);
            movements.push({
                fecha: mov.fecha,
                descripcion: mov.descripcion,
                debito,
                credito,
                saldo: mov.saldo,
                source_method: 'saldo_delta',
            });
            saldoAnterior = mov.saldo;
        }
        return movements;
    },
};
//# sourceMappingURL=galicia-mas.js.map