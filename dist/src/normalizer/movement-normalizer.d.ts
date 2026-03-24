import type { RawMovement, NormalizedMovement } from '../types';
/**
 * Normalise raw movements from any parser into a unified schema.
 *
 * - Dates → DD/MM/YYYY
 * - Amounts → numbers (already done by parsers, but re-validates)
 * - Sets banco, archivo_origen, batch_id, confidence
 */
export declare function normalizeMovements(raw: RawMovement[], bankCode: string, fileName: string): NormalizedMovement[];
//# sourceMappingURL=movement-normalizer.d.ts.map