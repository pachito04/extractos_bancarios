"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParser = getParser;
exports.listSupportedBanks = listSupportedBanks;
const nacion_1 = require("./nacion");
const galicia_1 = require("./galicia");
const galicia_mas_1 = require("./galicia-mas");
const credicoop_1 = require("./credicoop");
const macro_1 = require("./macro");
const santa_fe_1 = require("./santa-fe");
const conaig_1 = require("./conaig");
const mercado_pago_1 = require("./mercado-pago");
const santander_1 = require("./santander");
const municipal_1 = require("./municipal");
const REGISTRY = {
    BANCO_NACION: nacion_1.NacionParser,
    BANCO_GALICIA: galicia_1.GaliciaParser,
    BANCO_GALICIA_MAS: galicia_mas_1.GaliciaMasParser,
    BANCO_CREDICOOP: credicoop_1.CredicoopParser,
    BANCO_MACRO: macro_1.MacroParser,
    BANCO_SANTA_FE: santa_fe_1.SantaFeParser,
    BANCO_CONAIG: conaig_1.ConaigParser,
    MERCADO_PAGO: mercado_pago_1.MercadoPagoParser,
    BANCO_SANTANDER: santander_1.SantanderParser,
    BANCO_MUNICIPAL: municipal_1.MunicipalParser,
};
/**
 * Look up the parser for a given bank_code.
 * Returns null if no parser is registered for that bank.
 */
function getParser(bankCode) {
    return REGISTRY[bankCode] ?? null;
}
function listSupportedBanks() {
    return Object.keys(REGISTRY);
}
//# sourceMappingURL=registry.js.map