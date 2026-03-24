import { parseAmount, formatArgentino, normalizeDate, deltaDC, isAmount } from '../../src/parsers/base-parser';

describe('parseAmount', () => {
  test('parsea formato argentino 1.234,56', () => expect(parseAmount('1.234,56')).toBeCloseTo(1234.56));
  test('parsea sin separador de miles 234,56', () => expect(parseAmount('234,56')).toBeCloseTo(234.56));
  test('parsea entero 1234', () => expect(parseAmount('1234')).toBe(1234));
  test('parsea negativo -1.234,56', () => expect(parseAmount('-1.234,56')).toBeCloseTo(-1234.56));
  test('parsea negativo sufijo 1.234,56-', () => expect(parseAmount('1.234,56-')).toBeCloseTo(-1234.56));
  test('retorna 0 para string vacío', () => expect(parseAmount('')).toBe(0));
  test('retorna 0 para "-"', () => expect(parseAmount('-')).toBe(0));
  test('pasa números directamente', () => expect(parseAmount(42.5)).toBe(42.5));
});

describe('formatArgentino', () => {
  test('formatea 1234567.89', () => expect(formatArgentino(1234567.89)).toBe('1.234.567,89'));
  test('formatea 0', () => expect(formatArgentino(0)).toBe('0,00'));
  test('formatea 100', () => expect(formatArgentino(100)).toBe('100,00'));
  test('formatea 1234.56', () => expect(formatArgentino(1234.56)).toBe('1.234,56'));
});

describe('normalizeDate', () => {
  test('pasa DD/MM/YYYY sin cambios', () => expect(normalizeDate('15/03/2025')).toBe('15/03/2025'));
  test('convierte DD/MM/YY a DD/MM/YYYY', () => expect(normalizeDate('15/03/25')).toBe('15/03/2025'));
  test('convierte DD-MM-YYYY a DD/MM/YYYY', () => expect(normalizeDate('15-03-2025')).toBe('15/03/2025'));
  test('convierte DD-MONTHNAME a DD/MM/YYYY', () => {
    const result = normalizeDate('15-MAR');
    expect(result).toMatch(/^15\/03\/\d{4}$/);
  });
  test('retorna string vacío para input vacío', () => expect(normalizeDate('')).toBe(''));
});

describe('deltaDC', () => {
  test('crédito cuando saldo sube', () => {
    const { debito, credito } = deltaDC(1500, 1000);
    expect(debito).toBe(0);
    expect(credito).toBeCloseTo(500);
  });
  test('débito cuando saldo baja', () => {
    const { debito, credito } = deltaDC(800, 1000);
    expect(debito).toBeCloseTo(200);
    expect(credito).toBe(0);
  });
  test('sin movimiento cuando saldo igual', () => {
    const { debito, credito } = deltaDC(1000, 1000);
    expect(debito).toBe(0);
    expect(credito).toBe(0);
  });
});

describe('isAmount', () => {
  test('reconoce 1.234,56', () => expect(isAmount('1.234,56')).toBe(true));
  test('reconoce 234,56', () => expect(isAmount('234,56')).toBe(true));
  test('no reconoce texto', () => expect(isAmount('DEPOSITO')).toBe(false));
  test('no reconoce string vacío', () => expect(isAmount('')).toBe(false));
});
