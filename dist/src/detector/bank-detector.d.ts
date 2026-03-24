import type { BankDetectionResult } from '../types';
/**
 * Detect the bank from the normalised raw text of a bank statement.
 * Returns a BankDetectionResult with bank_code, bank_name, confidence (0-1)
 * and the parser_strategy to use.
 */
export declare function detectBank(rawText: string): BankDetectionResult;
//# sourceMappingURL=bank-detector.d.ts.map