import { NacionParser } from '../../../src/parsers/nacion';

const SAMPLE_TEXT = `
BANCO DE LA NACION ARGENTINA
CUENTA CORRIENTE N° 123456

SALDO ANTERIOR 10.000,00

01/03/25 DEPOSITO EFECTIVO 11.500,00
02/03/25 PAGO SERVICIO 10.800,00
03/03/25 TRANSFERENCIA RECIBIDA 12.300,00
`;

describe('NacionParser', () => {
  const movements = NacionParser.parse(SAMPLE_TEXT);

  test('extrae 3 movimientos', () => {
    expect(movements).toHaveLength(3);
  });

  test('primer movimiento es crédito', () => {
    expect(movements[0].credito).toBeCloseTo(1500);
    expect(movements[0].debito).toBe(0);
  });

  test('segundo movimiento es débito', () => {
    expect(movements[1].debito).toBeCloseTo(700);
    expect(movements[1].credito).toBe(0);
  });

  test('fechas normalizadas a DD/MM/YYYY', () => {
    expect(movements[0].fecha).toBe('01/03/2025');
    expect(movements[1].fecha).toBe('02/03/2025');
  });

  test('source_method es saldo_delta', () => {
    movements.forEach((m) => expect(m.source_method).toBe('saldo_delta'));
  });

  test('saldo secuencial es coherente', () => {
    // 10000 + 1500 = 11500
    expect(movements[0].saldo).toBeCloseTo(11500);
    // 11500 - 700 = 10800
    expect(movements[1].saldo).toBeCloseTo(10800);
    // 10800 + 1500 = 12300
    expect(movements[2].saldo).toBeCloseTo(12300);
  });
});
