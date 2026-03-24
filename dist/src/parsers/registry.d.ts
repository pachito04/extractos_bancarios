import type { IParser } from '../types';
/**
 * Look up the parser for a given bank_code.
 * Returns null if no parser is registered for that bank.
 */
export declare function getParser(bankCode: string): IParser | null;
export declare function listSupportedBanks(): string[];
//# sourceMappingURL=registry.d.ts.map