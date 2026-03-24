/**
 * Parser para Banco Municipal de Rosario.
 *
 * Formato del texto extraído por pdf-parse:
 *   FechaComprobanteConceptoDébitosCréditosSaldos  (header merged)
 *   04/02/202524021-4021 - Cred. Cupones Tarj. MASTERCARD-154.599,84517.784,90
 *   04/02/2025232013-32013-SIRCREB-3.865,00513.919,90
 *
 * La fecha es DD/MM/YYYY (4 dígitos) y va inmediatamente seguida del
 * número de comprobante (sin espacio). Los montos están pegados al final.
 * Se usa saldo_delta para calcular débitos/créditos.
 */
import type { IParser } from '../types';
export declare const MunicipalParser: IParser;
//# sourceMappingURL=municipal.d.ts.map