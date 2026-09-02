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
exports.Compose = void 0;
const node_events_1 = require("node:events");
const assert = __importStar(require("node:assert"));
const node_stream_1 = require("node:stream");
const openspan_1 = require("openspan");
class Compose {
    expressions;
    constructor(composition) {
        this.expressions = build(composition);
    }
    attach(context) {
        context.pipelines.response.push(async (message) => {
            if (!(message.body instanceof node_stream_1.Readable)) {
                openspan_1.console.warn('Response body is not a stream, skipping composition');
                return;
            }
            assert.ok(message.body instanceof node_stream_1.Readable, 'Response body is not a stream');
            // @ts-expect-error -- objectMode is not defined in the type definition
            assert.ok(message.body._readableState.objectMode, 'Response stream is not in object mode');
            const $ = await this.compose(message.body);
            message.body = this.execute($);
        });
    }
    async compose(stream) {
        const $ = [];
        stream.on('data', (data) => $.push(data));
        await (0, node_events_1.once)(stream, 'end');
        return $;
    }
    execute($) {
        let exception;
        for (const expression of this.expressions)
            try {
                return expression($);
            }
            catch (e) {
                exception = e;
                openspan_1.console.debug('Chunks composition failed', { cause: exception.message });
            }
        throw exception;
    }
}
exports.Compose = Compose;
function build(composition) {
    return Array.isArray(composition)
        ? composition.map((variant) => compile(variant))
        : [compile(composition)];
}
function compile(composition) {
    const text = typeof composition === 'string'
        ? `return ${composition}`
        : `return ${json(composition)}`;
    // eslint-disable-next-line @typescript-eslint/no-implied-eval,no-new-func
    return new Function('$', text);
}
function json(node) {
    if (typeof node === 'string')
        if (node.startsWith('\\'))
            return `"${node}"`;
        else
            return node;
    if (Array.isArray(node))
        return `[${node.map((v) => json(v)).join(',')}]`;
    if (node.constructor !== Object)
        return JSON.stringify(node);
    return '{' + Object.entries(node)
        .map(([key, value]) => `"${key}": ${json(value)}`).join(',') + '}';
}
//# sourceMappingURL=Compose.js.map