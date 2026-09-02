"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Language = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const negotiator_1 = __importDefault(require("negotiator"));
const index_js_1 = require("../cors/index.js");
const Mapping_js_1 = require("./Mapping.js");
const Languages_js_1 = require("./Languages.js");
class Language extends Mapping_js_1.Mapping {
    languages = null;
    constructor(property) {
        node_assert_1.default.ok(typeof property === 'string', '`map:language` must be a string');
        index_js_1.cors.allow('accept-language');
        super(property);
    }
    properties(context, parameters, directives) {
        this.languages ??= this.resolve(directives);
        const negotiator = new negotiator_1.default(context.request);
        const language = negotiator.language(this.languages) ?? this.languages[0];
        context.pipelines.response.push((response) => {
            response.headers ??= new Headers();
            response.headers.set('content-language', language);
            response.headers.append('vary', 'accept-language');
        });
        return { [this.value]: language };
    }
    resolve(directives) {
        for (const directive of directives)
            if (directive instanceof Languages_js_1.Languages)
                return directive.value;
        throw new Error('Supported languages are not defined, add `map:languages` directive');
    }
}
exports.Language = Language;
//# sourceMappingURL=Language.js.map