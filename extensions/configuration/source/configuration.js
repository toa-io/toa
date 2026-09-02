"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.overridden = overridden;
exports.local = local;
exports.fit = fit;
const generic_1 = require("@toa.io/generic");
const schemas = __importStar(require("@toa.io/schemas"));
const const_js_1 = require("./const.js");
const Secret_js_1 = require("./Secret.js");
/** The variable is set, so the values service is not consulted. */
function overridden(locator) {
    return process.env[const_js_1.PREFIX + locator.uppercase] !== undefined;
}
/** The variable, the manifest defaults, then the schema. */
function local(locator, manifest) {
    const values = read(locator.uppercase);
    if (manifest.defaults !== undefined)
        (0, generic_1.add)(values, manifest.defaults);
    return fit(values, manifest);
}
/** A copy of the value with the schema applied and the secrets substituted. */
function fit(raw, manifest) {
    // a copy of the caller's, and one of this realm: what came over the wire is JSON anyway
    const values = JSON.parse(JSON.stringify(raw));
    // the schema sees the references, which are the strings it declares
    validate(values, manifest);
    substituteSecrets(values);
    return values;
}
function validate(values, manifest) {
    const schema = schemas.schema(manifest.schema);
    schema.validate(values);
}
function read(suffix) {
    const variable = const_js_1.PREFIX + suffix;
    const string = process.env[variable];
    if (string === undefined)
        return {};
    else
        return JSON.parse(string);
}
function substituteSecrets(configuration) {
    for (const [key, value] of Object.entries(configuration)) {
        if (typeof value === 'object' && value !== null)
            substituteSecrets(value);
        if (typeof value !== 'string')
            continue;
        const match = value.match(const_js_1.SECRET_RX);
        if (match === null)
            continue;
        const name = match.groups?.variable;
        configuration[key] = new Secret_js_1.Secret(getSecret(name));
    }
}
function getSecret(name) {
    const variable = const_js_1.PREFIX + '_' + name;
    const value = process.env[variable];
    if (value === undefined)
        throw new Error(`${variable} is not set.`);
    return value;
}
//# sourceMappingURL=configuration.js.map