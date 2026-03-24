import { validateMovements } from '../../src/validator/movement-validator';
import type { NormalizedMovement } from '../../src/types';

function makeMovement(overrides: Partial<NormalizedMovement>): NormalizedMovement {
  return {
    fecha: '15/03/2025',
    descripcion: 'DEPOSITO EN EFECTIVO',
    debito: 0,
    credito: 1000,
    saldo: 5000,
    source_method: 'saldo_delta',
    banco: 'BANCO_NACION',
    archivo_origen: 'test.pdf',
    batch_id: 'test_batch_1',
    confidence: 'medium',
    ...overrides,
  };
}

describe('validateMovements', () => {
  test('movimiento válido queda como valid', () => {
    const movs: NormalizedMovement[] = [
      makeMovement({ saldo: 1000, credito: 1000, debito: 0 }),
      makeMovement({ fecha: '16/03/2025', saldo: 1500, credito: 500, debito: 0 }),
    ];
    const result = validateMovements(movs);
    expect(result[1].validation_status).toBe('valid');
  });

  test('C1: fecha ausente → invalid', () => {
    const movs = [makeMovement({ fecha: '' })];
    const result = validateMovements(movs);
    expect(result[0].validation_status).toBe('invalid');
    expect(result[0].validation_reason).toContain('C1');
  });

  test('C2: descripcion ausente → doubtful', () => {
    const movs = [makeMovement({ descripcion: '' })];
    const result = validateMovements(movs);
    expect(result[0].validation_status).toBe('doubtful');
    expect(result[0].validation_reason).toContain('C2');
  });

  test('C3: débito y crédito simultáneos → doubtful', () => {
    const movs = [makeMovement({ debito: 100, credito: 100 })];
    const result = validateMovements(movs);
    expect(result[0].validation_status).toBe('doubtful');
    expect(result[0].validation_reason).toContain('C3');
  });

  test('C6: descuadre de saldo → doubtful', () => {
    const movs: NormalizedMovement[] = [
      makeMovement({ saldo: 1000, credito: 1000, debito: 0 }),
      // saldo debería ser 1500 (1000 + 500) pero ponemos 2000
      makeMovement({ fecha: '16/03/2025', saldo: 2000, credito: 500, debito: 0 }),
    ];
    const result = validateMovements(movs);
    expect(result[1].validation_status).toBe('doubtful');
    expect(result[1].validation_reason).toContain('C6');
  });

  test('C6: descuadre grave (>1000) → invalid', () => {
    const movs: NormalizedMovement[] = [
      makeMovement({ saldo: 1000, credito: 1000, debito: 0 }),
      makeMovement({ fecha: '16/03/2025', saldo: 50000, credito: 500, debito: 0 }),
    ];
    const result = validateMovements(movs);
    expect(result[1].validation_status).toBe('invalid');
  });

  test('multiple movimientos válidos tienen saldo secuencial', () => {
    const movs: NormalizedMovement[] = [
      makeMovement({ saldo: 1000, credito: 1000, debito: 0 }),
      makeMovement({ fecha: '16/03/2025', saldo: 800,  credito: 0, debito: 200 }),
      makeMovement({ fecha: '17/03/2025', saldo: 1300, credito: 500, debito: 0 }),
    ];
    const result = validateMovements(movs);
    expect(result.every((r) => r.validation_status === 'valid')).toBe(true);
  });
});
