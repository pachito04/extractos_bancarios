/**
 * extractor-bancario — Public API
 *
 * Single entry point for all consumers:
 *   - n8n HTTP server (server/http-server.ts)
 *   - Lovable / SaaS frontend (via bundler)
 *   - CLI scripts
 *   - Tests
 */
import type { ProcessResult, AccountPlanConfig } from './types';
export { generateExcelFromResult } from './generator/excel-generator';
export { DEFAULT_ACCOUNT_PLAN } from './generator/libro-diario';
export * from './types';
export interface ProcessInput {
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
    accountPlanConfig?: AccountPlanConfig;
}
/**
 * Full pipeline:
 *   extract text → detect bank → parse → normalize → validate → classify → libro diario
 *
 * Returns the canonical JSON result. Excel is generated separately via
 * generateExcelFromResult(result).
 */
export declare function processExtract(input: ProcessInput): Promise<ProcessResult>;
/**
 * Quick preview: extract, detect, parse, validate, classify — no Excel generation.
 * Ideal for UI preview before generating the final report.
 */
export declare function previewExtract(input: Omit<ProcessInput, 'accountPlanConfig'>): Promise<Pick<ProcessResult, 'bank_code' | 'bank_name' | 'detector_confidence' | 'extraction_method' | 'movements' | 'classified_movements' | 'observations' | 'review_required_count'>>;
//# sourceMappingURL=index.d.ts.map