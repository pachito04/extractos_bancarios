import type {
  ClassifiedMovement, LibroDiarioEntry,
  AccountPlanConfig, AccountMappingRule,
  AccountingCategory,
} from '../types';

// ---------------------------------------------------------------------------
// Default Argentine account plan (configurable)
// ---------------------------------------------------------------------------

export const DEFAULT_ACCOUNT_PLAN: AccountPlanConfig = {
  rules: [
    { categoria: 'INGRESO_OPERATIVO',    cuenta_debe: '1.1.1 Banco',            cuenta_haber: '4.1.1 Ingresos Operativos' },
    { categoria: 'COBRO_CLIENTE',        cuenta_debe: '1.1.1 Banco',            cuenta_haber: '1.2.1 Cuentas a Cobrar'    },
    { categoria: 'APORTE',              cuenta_debe: '1.1.1 Banco',            cuenta_haber: '2.1.1 Capital'              },
    { categoria: 'GASTO_BANCARIO',       cuenta_debe: '6.1.1 Gastos Bancarios', cuenta_haber: '1.1.1 Banco'               },
    { categoria: 'IMPUESTO_RETENCION',   cuenta_debe: '1.1.5 Retenciones',      cuenta_haber: '1.1.1 Banco'               },
    { categoria: 'RETIRO',              cuenta_debe: '1.1.2 Caja',             cuenta_haber: '1.1.1 Banco'               },
    { categoria: 'PAGO_PROVEEDOR',      cuenta_debe: '4.2.1 Proveedores',      cuenta_haber: '1.1.1 Banco'               },
    { categoria: 'SERVICIO',            cuenta_debe: '6.1.2 Servicios',        cuenta_haber: '1.1.1 Banco'               },
    { categoria: 'TRANSFERENCIA_INTERNA', cuenta_debe: '1.1.1 Banco',          cuenta_haber: '1.1.1 Banco'               },
    { categoria: 'OTROS',              cuenta_debe: '6.1.9 Varios',           cuenta_haber: '1.1.1 Banco'               },
  ],
};

function getMapping(
  categoria: AccountingCategory,
  plan: AccountPlanConfig,
): AccountMappingRule {
  const rule = plan.rules.find((r) => r.categoria === categoria);
  // Fallback to OTROS if category not in plan
  return rule ?? plan.rules.find((r) => r.categoria === 'OTROS')!;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Transform a list of classified movements into Libro Diario entries.
 * Each movement becomes one asiento with a sequential number.
 *
 * The importe is max(debito, credito) — the actual movement amount.
 * review_required is carried from classification.
 */
export function generateLibroDiario(
  movements: ClassifiedMovement[],
  accountPlan: AccountPlanConfig = DEFAULT_ACCOUNT_PLAN,
): LibroDiarioEntry[] {
  const entries: LibroDiarioEntry[] = [];
  let numero = 1;

  for (const mov of movements) {
    const mapping = getMapping(mov.categoria, accountPlan);
    const importe = Math.max(mov.debito, mov.credito);

    // Determine debe/haber based on whether it's a debit or credit movement
    let cuenta_debe = mapping.cuenta_debe;
    let cuenta_haber = mapping.cuenta_haber;

    // For credit movements (money IN), swap if needed
    // Convention: debito = outflow, credito = inflow
    // The plan already encodes this correctly per category.

    entries.push({
      fecha: mov.fecha,
      numero_asiento: numero++,
      cuenta_debe,
      cuenta_haber,
      concepto: mov.descripcion,
      importe,
      banco: mov.banco,
      archivo_origen: mov.archivo_origen,
      categoria: mov.categoria,
      review_required: mov.review_required || mov.validation_status !== 'valid',
    });
  }

  return entries;
}
