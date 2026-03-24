/**
 * Integration tests — run the full pipeline against real PDFs.
 *
 * Setup:
 *   1. Copy PDF files from C:\Users\juanp\Downloads\Extractos\ to tests/fixtures\
 *   2. Create matching golden JSON files in tests/golden\
 *   3. Run: npm run test:integration
 *
 * Tests are skipped automatically if the fixture file is not present,
 * so CI doesn't fail on a fresh clone.
 */

import * as fs from 'fs';
import * as path from 'path';
import { processExtract } from '../../src/index';
import { generateExcelFromResult } from '../../src/generator/excel-generator';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const GOLDEN_DIR   = path.join(__dirname, '..', 'golden');

interface GoldenFile {
  fixture: string;
  bank_code: string;
  expected_movements_count: number;
  expected_saldo_final: number;
  expected_total_debitos: number;
  expected_total_creditos: number;
  max_invalid_movements: number;
  tolerance?: number;
}

function loadGoldenFiles(): GoldenFile[] {
  if (!fs.existsSync(GOLDEN_DIR)) return [];
  return fs.readdirSync(GOLDEN_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, f), 'utf8')) as GoldenFile);
}

const goldenFiles = loadGoldenFiles();

describe('Full pipeline integration tests', () => {
  if (goldenFiles.length === 0) {
    test.todo('No golden files found — add PDFs to tests/fixtures/ and golden files to tests/golden/');
    return;
  }

  for (const golden of goldenFiles) {
    const fixturePath = path.join(FIXTURES_DIR, golden.fixture);
    const tol = golden.tolerance ?? 0.02;

    const describeLabel = `[${golden.bank_code}] ${golden.fixture}`;

    describe(describeLabel, () => {
      let result: Awaited<ReturnType<typeof processExtract>>;

      beforeAll(async () => {
        if (!fs.existsSync(fixturePath)) return;
        const buffer = fs.readFileSync(fixturePath);
        result = await processExtract({
          fileBuffer: buffer,
          fileName: golden.fixture,
          mimeType: 'application/pdf',
        });
      });

      const maybeTest = fs.existsSync(fixturePath) ? test : test.skip;

      maybeTest('banco detectado correctamente', () => {
        expect(result.bank_code).toBe(golden.bank_code);
      });

      maybeTest('cantidad de movimientos', () => {
        expect(result.movements.length).toBe(golden.expected_movements_count);
      });

      maybeTest('saldo final dentro de tolerancia', () => {
        expect(Math.abs(result.resumen.saldo_final - golden.expected_saldo_final)).toBeLessThanOrEqual(tol);
      });

      maybeTest('total débitos dentro de tolerancia', () => {
        expect(Math.abs(result.resumen.total_debitos - golden.expected_total_debitos)).toBeLessThanOrEqual(tol);
      });

      maybeTest('total créditos dentro de tolerancia', () => {
        expect(Math.abs(result.resumen.total_creditos - golden.expected_total_creditos)).toBeLessThanOrEqual(tol);
      });

      maybeTest('movimientos inválidos dentro del límite', () => {
        expect(result.resumen.invalidos).toBeLessThanOrEqual(golden.max_invalid_movements);
      });

      maybeTest('genera Excel válido (3 hojas)', () => {
        const XLSX = require('xlsx');
        const buf = generateExcelFromResult(result);
        expect(buf).toBeInstanceOf(Buffer);
        expect(buf.length).toBeGreaterThan(100);
        const wb = XLSX.read(buf, { type: 'buffer' });
        expect(wb.SheetNames).toContain('Libro Diario');
        expect(wb.SheetNames).toContain('Observaciones');
        expect(wb.SheetNames).toContain('Resumen');
      });

      maybeTest('classified_movements tiene categorías asignadas', () => {
        expect(result.classified_movements.length).toBe(result.movements.length);
        result.classified_movements.forEach((m) => {
          expect(m.categoria).toBeTruthy();
        });
      });
    });
  }
});
