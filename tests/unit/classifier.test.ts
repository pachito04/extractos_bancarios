import { classifyMovements } from '../../src/classifier/accounting-classifier';
import type { ValidatedMovement } from '../../src/types';

function makeMov(descripcion: string, debito = 0, credito = 100): ValidatedMovement {
  return {
    fecha: '15/03/2025',
    descripcion,
    debito,
    credito,
    saldo: 5000,
    source_method: 'saldo_delta',
    banco: 'BANCO_NACION',
    archivo_origen: 'test.pdf',
    batch_id: 'test_1',
    confidence: 'medium',
    validation_status: 'valid',
    validation_reason: '',
  };
}

describe('classifyMovements', () => {
  test('clasifica GASTO_BANCARIO por exact match', () => {
    const [r] = classifyMovements([makeMov('MANTENIMIENTO DE CUENTA', 50, 0)]);
    expect(r.categoria).toBe('GASTO_BANCARIO');
    expect(r.classification_source).toBe('rule_exact');
    expect(r.review_required).toBe(false);
  });

  test('clasifica IMPUESTO_RETENCION por IIBB', () => {
    const [r] = classifyMovements([makeMov('RETENCION IIBB ARBA', 200, 0)]);
    expect(r.categoria).toBe('IMPUESTO_RETENCION');
  });

  test('clasifica RETIRO por EXTRACCION', () => {
    const [r] = classifyMovements([makeMov('EXTRACCION CAJERO AUTOMATICO', 500, 0)]);
    expect(r.categoria).toBe('RETIRO');
  });

  test('clasifica SERVICIO por EDENOR', () => {
    const [r] = classifyMovements([makeMov('PAGO EDENOR FACTURA 1234', 1200, 0)]);
    expect(r.categoria).toBe('SERVICIO');
  });

  test('clasifica OTROS con review_required=true cuando no hay match', () => {
    const [r] = classifyMovements([makeMov('OPERACION MISTERIOSA XYZ 99')]);
    expect(r.categoria).toBe('OTROS');
    expect(r.review_required).toBe(true);
    expect(r.classification_source).toBe('fallback');
  });

  test('clasifica contextual con confidence medium y review_required', () => {
    const [r] = classifyMovements([makeMov('CARGO POR EMISIÓN DE ALGO')]);
    // CARGO es contextual para GASTO_BANCARIO
    expect(r.classification_confidence).toBe('medium');
    expect(r.review_required).toBe(true);
  });

  test('clasifica múltiples movimientos', () => {
    const movs = [
      makeMov('MANTENIMIENTO', 50, 0),
      makeMov('RETENCION IIBB', 100, 0),
      makeMov('DEPOSITO CHEQUE', 0, 5000),
    ];
    const results = classifyMovements(movs);
    expect(results).toHaveLength(3);
    expect(results[0].categoria).toBe('GASTO_BANCARIO');
    expect(results[1].categoria).toBe('IMPUESTO_RETENCION');
  });
});
