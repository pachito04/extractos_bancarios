import { detectBank } from '../../src/detector/bank-detector';

describe('detectBank', () => {
  test('detecta Banco Nación', () => {
    const text = 'BANCO DE LA NACION ARGENTINA EXTRACTO DE CUENTA';
    const result = detectBank(text);
    expect(result.bank_code).toBe('BANCO_NACION');
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  test('detecta Banco Galicia Más (prioridad sobre Galicia)', () => {
    const text = 'BANCO GALICIA MAS EXTRACTO';
    const result = detectBank(text);
    expect(result.bank_code).toBe('BANCO_GALICIA_MAS');
  });

  test('detecta Banco Galicia (no Galicia Más)', () => {
    const text = 'BANCO GALICIA Y BUENOS AIRES RESUMEN DE CUENTA';
    const result = detectBank(text);
    expect(result.bank_code).toBe('BANCO_GALICIA');
  });

  test('detecta Credicoop por CUIT', () => {
    const text = 'CUIT 30-50000019-8 BANCO CREDICOOP COOPERATIVO LIMITADO';
    const result = detectBank(text);
    expect(result.bank_code).toBe('BANCO_CREDICOOP');
  });

  test('detecta Mercado Pago', () => {
    const text = 'MERCADO PAGO EXTRACTO DE CUENTA';
    const result = detectBank(text);
    expect(result.bank_code).toBe('MERCADO_PAGO');
  });

  test('detecta Santander', () => {
    const text = 'BANCO SANTANDER ARGENTINA SA CUENTA CORRIENTE';
    const result = detectBank(text);
    expect(result.bank_code).toBe('BANCO_SANTANDER');
  });

  test('detecta Municipal', () => {
    const text = 'BANCO MUNICIPAL DE ROSARIO EXTRACTO';
    const result = detectBank(text);
    expect(result.bank_code).toBe('BANCO_MUNICIPAL');
  });

  test('retorna DESCONOCIDO para texto sin banco', () => {
    const text = 'esto no tiene nada que ver con ningún banco';
    const result = detectBank(text);
    expect(result.bank_code).toBe('DESCONOCIDO');
    expect(result.confidence).toBe(0);
  });
});
