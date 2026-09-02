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
exports.Captures = void 0;
const assert = __importStar(require("node:assert"));
const index_js_1 = require("./functions/index.js");
class Captures extends Map {
    functions;
    constructor(functions) {
        super();
        this.functions = functions;
    }
    substitute(text) {
        for (const [key, value] of this.entries())
            text = text.replaceAll(`\${{ ${key} }}`, value);
        text = text.replaceAll(PIPELINE, (_, pipeline) => {
            let value = '';
            const expressions = pipeline.split('|').map((expression) => expression.trim());
            for (const expression of expressions) {
                const [fn, ...args] = expression.split(/\s+/);
                const f = this.functions?.[fn] ?? index_js_1.functions[fn];
                assert.ok(f !== undefined, `Unknown pipeline function: ${fn}`);
                value = f.call(this, value, ...args);
            }
            return value;
        });
        return text;
    }
    /**
     * @returns `null` if `source` doesn't match `matcher`
     * or array of captured keys (can be empty) with `end` set to the index after the match
     */
    capture(source, matcher) {
        let i = 0;
        matcher = this.substitute(matcher);
        const expression = PADDING + regexpEscape(matcher).replaceAll(CAPTURE, (_, name) => `(?<${Buffer.from(name + '#' + i++).toString('base64url')}>[^\\s"']{1,2048})`);
        const rx = new RegExp(expression, 'i');
        const match = source.match(rx);
        if (match === null)
            return null;
        const keys = Object.entries(match.groups ?? {}).map(([key, value]) => {
            const parts = regexpUnescape(Buffer.from(key, 'base64url').toString()).split('#');
            const name = parts.slice(0, -1).join('#');
            this.set(name, value);
            return name;
        });
        Object.defineProperty(keys, 'end', {
            value: match.index + match[0].length
        });
        return keys;
    }
}
exports.Captures = Captures;
function regexpEscape(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function regexpUnescape(text) {
    return text.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');
}
const CAPTURE = /\\\$\\{\\{\s*(?<name>\S{0,32})\s*\\}\\}/g;
const PADDING = '(?:^|\\s+)';
const PIPELINE = /#{{ (?<pipeline>[^}]{1,256}) }}/g;
//# sourceMappingURL=Captures.js.map