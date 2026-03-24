import type { ClassifiedMovement, LibroDiarioEntry, AccountPlanConfig } from '../types';
export declare const DEFAULT_ACCOUNT_PLAN: AccountPlanConfig;
/**
 * Transform a list of classified movements into Libro Diario entries.
 * Each movement becomes one asiento with a sequential number.
 *
 * The importe is max(debito, credito) — the actual movement amount.
 * review_required is carried from classification.
 */
export declare function generateLibroDiario(movements: ClassifiedMovement[], accountPlan?: AccountPlanConfig): LibroDiarioEntry[];
//# sourceMappingURL=libro-diario.d.ts.map