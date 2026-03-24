"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMovements = validateMovements;
const base_parser_1 = require("../parsers/base-parser");
const RE_DATE = /^\d{2}\/\d{2}\/\d{4}$/;
const RE_TOTAL = /^(TOTAL|SUBTOTAL|SALDO FINAL|SALDO ACUM|TRANSPORTE)\b/i;
/**
 * Apply 10-point validation to a list of normalised movements.
 * Each movement is tagged with validation_status and validation_reason.
 *
 * Rules:
 *  C1  Date format is DD/MM/YYYY
 *  C2  Description is present (≥ 2 chars)
 *  C3  No simultaneous debit AND credit > 0
 *  C4  Balance unchanged while amount is zero (possible ghost row)
 *  C5  Balance absent while movement is present
 *  C6  Sequential balance check (main accounting rule)
 *  C7  Impossible balance jump (large gap with no movement)
 *  C8  Balance unchanged despite non-zero movement
 *  C9  Line looks like a subtotal / total row
 *  C10 Low-confidence source method downgrades confidence
 */
function validateMovements(movements) {
    const result = [];
    let saldoAnterior = null;
    for (let i = 0; i < movements.length; i++) {
        const mov = movements[i];
        const { debito, credito, saldo, descripcion, fecha, source_method } = mov;
        const issues = [];
        let status = 'valid';
        let confidence = mov.confidence;
        const setDoubtful = (reason) => {
            if (status !== 'invalid')
                status = 'doubtful';
            issues.push(reason);
        };
        const setInvalid = (reason) => {
            status = 'invalid';
            issues.push(reason);
        };
        // C1 – Date format
        if (!fecha || fecha.trim() === '') {
            setInvalid('C1:fecha_ausente');
        }
        else if (!RE_DATE.test(fecha)) {
            setDoubtful('C1:fecha_formato_invalido');
        }
        // C2 – Description present
        if (!descripcion || descripcion.trim().length < 2) {
            setDoubtful('C2:descripcion_ausente');
        }
        // C3 – Simultaneous debit AND credit
        if (debito > 0.01 && credito > 0.01) {
            setDoubtful('C3:debito_y_credito_simultaneos');
        }
        // C4 – Zero movement but balance changed vs previous
        if (debito === 0 && credito === 0 && saldoAnterior !== null && i > 0) {
            const salto = Math.abs(saldo - saldoAnterior);
            if (salto > 0.02) {
                setDoubtful('C4:saldo_cambia_sin_movimiento');
            }
        }
        // C5 – Balance is zero but movement is non-zero
        if (saldo === 0 && (debito > 0.01 || credito > 0.01)) {
            setDoubtful('C5:saldo_ausente_con_movimiento');
        }
        // C6 – Sequential balance (main rule)
        if (saldoAnterior !== null && i > 0) {
            const esperado = (0, base_parser_1.round2)(saldoAnterior + credito - debito);
            const diff = Math.abs((0, base_parser_1.round2)(esperado - saldo));
            if (diff > 0.02) {
                if (diff > 1000) {
                    setInvalid(`C6:descuadre_grave(diff=${diff.toFixed(2)})`);
                }
                else {
                    setDoubtful(`C6:descuadre_leve(diff=${diff.toFixed(2)})`);
                }
            }
        }
        // C7 – Impossible balance jump: large gap with zero movement
        if (saldoAnterior !== null) {
            const salto = Math.abs(saldo - saldoAnterior);
            if (salto > 100000 && debito === 0 && credito === 0) {
                setInvalid(`C7:salto_imposible(diff=${salto.toFixed(2)})`);
            }
        }
        // C8 – Balance unchanged despite non-zero movement
        if (saldoAnterior !== null && saldo === saldoAnterior && (debito > 0.01 || credito > 0.01)) {
            setDoubtful('C8:saldo_no_cambia_con_movimiento');
        }
        // C9 – Subtotal / total row confusion
        if (RE_TOTAL.test(descripcion.toUpperCase())) {
            setDoubtful('C9:posible_subtotal');
        }
        // C10 – Source method confidence downgrade
        if (source_method === 'saldo_delta' && confidence === 'high') {
            confidence = 'medium';
        }
        if (source_method === 'ocr_reconstructed') {
            confidence = 'low';
            issues.push('C10:fuente_ocr');
        }
        saldoAnterior = saldo;
        result.push({
            ...mov,
            confidence,
            validation_status: status,
            validation_reason: issues.join(' | '),
        });
    }
    return result;
}
//# sourceMappingURL=movement-validator.js.map