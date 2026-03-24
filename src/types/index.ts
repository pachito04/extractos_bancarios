// ============================================================================
// PIPELINE: ExtractedTextResult → BankDetectionResult → RawMovement[]
//        → NormalizedMovement[] → ValidatedMovement[]
//        → ClassifiedMovement[] → LibroDiarioEntry[]
// ============================================================================

// ---------------------------------------------------------------------------
// A. TEXT EXTRACTOR
// ---------------------------------------------------------------------------

export type SourceMethod =
  | 'column_parse'
  | 'saldo_delta'
  | 'inferred'
  | 'ocr_reconstructed'
  | 'manual_fix';

export interface ExtractedTextResult {
  raw_text: string;
  method: 'embedded' | 'ocr';
  confidence?: number;  // 0-1
  pages?: string[];     // texto por página, útil para debug
}

// ---------------------------------------------------------------------------
// B. BANK DETECTOR
// ---------------------------------------------------------------------------

export interface BankDetectionResult {
  bank_code: string;
  bank_name: string;
  confidence: number;        // 0-1
  parser_strategy: string;   // nombre del parser que se usará
}

// ---------------------------------------------------------------------------
// C. PARSERS — pipeline de movimientos
// ---------------------------------------------------------------------------

/** Salida cruda de cada parser de banco */
export interface RawMovement {
  fecha: string;        // como viene del parser, puede ser DD/MM/YY o DD/MM/YYYY
  descripcion: string;
  debito: number;       // número limpio
  credito: number;
  saldo: number;
  source_method: SourceMethod;
}

/** Después de normalizar campos y fechas */
export interface NormalizedMovement extends RawMovement {
  fecha: string;           // siempre DD/MM/YYYY
  banco: string;
  archivo_origen: string;
  batch_id: string;
  confidence: 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// D. VALIDATOR
// ---------------------------------------------------------------------------

export interface ValidatedMovement extends NormalizedMovement {
  validation_status: 'valid' | 'doubtful' | 'invalid';
  validation_reason: string;   // pipe-separated list of issues
}

// ---------------------------------------------------------------------------
// E. CLASSIFIER
// ---------------------------------------------------------------------------

export type AccountingCategory =
  | 'TRANSFERENCIA_INTERNA'
  | 'IMPUESTO_RETENCION'
  | 'GASTO_BANCARIO'
  | 'INGRESO_OPERATIVO'
  | 'RETIRO'
  | 'APORTE'
  | 'PAGO_PROVEEDOR'
  | 'COBRO_CLIENTE'
  | 'SERVICIO'
  | 'OTROS';

export interface ClassifiedMovement extends ValidatedMovement {
  categoria: AccountingCategory;
  subcategoria?: string;
  classification_source: 'rule_exact' | 'rule_contextual' | 'fallback';
  classification_confidence: 'high' | 'medium' | 'low';
  review_required: boolean;
  review_reason?: string;
}

// ---------------------------------------------------------------------------
// F. LIBRO DIARIO
// ---------------------------------------------------------------------------

export interface LibroDiarioEntry {
  fecha: string;
  numero_asiento: number;
  cuenta_debe: string;
  cuenta_haber: string;
  concepto: string;
  importe: number;
  banco: string;
  archivo_origen: string;
  categoria: AccountingCategory;
  review_required: boolean;
}

// Plan de cuentas configurable
export interface AccountMappingRule {
  categoria: AccountingCategory;
  cuenta_debe: string;
  cuenta_haber: string;
}

export interface AccountPlanConfig {
  rules: AccountMappingRule[];
}

// ---------------------------------------------------------------------------
// G. RESULTADO FINAL CANÓNICO
// ---------------------------------------------------------------------------

export interface ProcessResult {
  raw_text: string;
  extraction_method: 'embedded' | 'ocr';
  extraction_confidence?: number;
  bank_code: string;
  bank_name: string;
  detector_confidence: number;
  parser_used: string;
  parser_confidence?: number;
  movements: ValidatedMovement[];
  classified_movements: ClassifiedMovement[];
  libro_diario: LibroDiarioEntry[];
  observations: string[];
  review_required_count: number;
  resumen: ProcessResumen;
}

export interface ProcessResumen {
  total_movimientos: number;
  validos: number;
  dudosos: number;
  invalidos: number;
  total_debitos: number;
  total_creditos: number;
  saldo_inicial: number;
  saldo_final: number;
}

// ---------------------------------------------------------------------------
// INTERFACE DE PARSER (para el registry)
// ---------------------------------------------------------------------------

export interface IParser {
  bankCode: string;
  parse(rawText: string): RawMovement[];
}
