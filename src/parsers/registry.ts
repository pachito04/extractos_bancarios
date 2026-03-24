import type { IParser } from '../types';
import { NacionParser }      from './nacion';
import { GaliciaParser }     from './galicia';
import { GaliciaMasParser }  from './galicia-mas';
import { CredicoopParser }   from './credicoop';
import { MacroParser }       from './macro';
import { SantaFeParser }     from './santa-fe';
import { ConaigParser }      from './conaig';
import { MercadoPagoParser } from './mercado-pago';
import { SantanderParser }   from './santander';
import { MunicipalParser }   from './municipal';

const REGISTRY: Record<string, IParser> = {
  BANCO_NACION:      NacionParser,
  BANCO_GALICIA:     GaliciaParser,
  BANCO_GALICIA_MAS: GaliciaMasParser,
  BANCO_CREDICOOP:   CredicoopParser,
  BANCO_MACRO:       MacroParser,
  BANCO_SANTA_FE:    SantaFeParser,
  BANCO_CONAIG:      ConaigParser,
  MERCADO_PAGO:      MercadoPagoParser,
  BANCO_SANTANDER:   SantanderParser,
  BANCO_MUNICIPAL:   MunicipalParser,
};

/**
 * Look up the parser for a given bank_code.
 * Returns null if no parser is registered for that bank.
 */
export function getParser(bankCode: string): IParser | null {
  return REGISTRY[bankCode] ?? null;
}

export function listSupportedBanks(): string[] {
  return Object.keys(REGISTRY);
}
