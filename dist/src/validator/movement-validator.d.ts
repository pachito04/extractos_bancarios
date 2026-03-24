import type { NormalizedMovement, ValidatedMovement } from '../types';
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
export declare function validateMovements(movements: NormalizedMovement[]): ValidatedMovement[];
//# sourceMappingURL=movement-validator.d.ts.map