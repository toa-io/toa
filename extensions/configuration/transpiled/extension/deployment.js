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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployment = void 0;
const schemas = __importStar(require("@toa.io/schemas"));
const generic_1 = require("@toa.io/generic");
const validators = __importStar(require("./schemas"));
function deployment(instances, annotation) {
    validators.annotation.validate(annotation);
    const variables = {};
    for (const instance of instances) {
        const values = annotation[instance.locator.id];
        if (values === undefined)
            continue;
        validate(instance, values);
        variables[instance.locator.label] = [{
                name: `TOA_CONFIGURATION_${instance.locator.uppercase}`,
                value: (0, generic_1.encode)(values)
            }];
        const secrets = createSecrets(values);
        variables[instance.locator.label].push(...secrets);
    }
    return { variables };
}
exports.deployment = deployment;
function createSecrets(values) {
    const secrets = [];
    for (const value of Object.values(values)) {
        if (typeof value !== 'string')
            continue;
        const match = value.match(SECRET_RX);
        if (match === null)
            continue;
        const name = match.groups?.variable;
        secrets.push({
            name: 'TOA_CONFIGURATION__' + name,
            secret: {
                name: 'toa-configuration',
                key: name
            }
        });
    }
    return secrets;
}
function validate(instace, values) {
    const defaults = instace.manifest.defaults ?? {};
    const configuration = (0, generic_1.overwrite)(defaults, values);
    const schema = schemas.schema(instace.manifest.schema);
    schema.validate(configuration);
}
const SECRET_RX = /^\$(?<variable>[A-Z0-9_]{1,32})$/;
//# sourceMappingURL=deployment.js.map