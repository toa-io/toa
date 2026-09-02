"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAMPLE_LIMIT = exports.REDACTED = exports.DENIED = exports.MAX_EDGES = exports.ANNOUNCE_INTERVAL = exports.DEFAULT_THRESHOLD = exports.DEFAULT_INTERVAL = exports.UI_PORT = exports.UI_PATH = exports.EDGES = exports.NODES = exports.ENV = exports.NAMESPACE = exports.ID = void 0;
exports.ID = 'introspection';
exports.NAMESPACE = 'introspection';
exports.ENV = 'TOA_INTROSPECTION';
exports.NODES = 'nodes';
exports.EDGES = 'edges';
/** Where the UI is mounted; `/introspection/*` belongs to the components' own API. */
exports.UI_PATH = '/.introspection';
exports.UI_PORT = 8002;
exports.DEFAULT_INTERVAL = 300;
exports.DEFAULT_THRESHOLD = 1024;
/** How often a component re-announces its description, so that removed components fade out. */
exports.ANNOUNCE_INTERVAL = 1_800_000;
/**
 * `source` arrives over the wire, so the number of distinct edges a process
 * can hold must be bounded regardless of what peers send.
 */
exports.MAX_EDGES = 4096;
/** Never capture samples for these namespaces, whatever the annotation says. */
exports.DENIED = new Set(['identity', 'introspection']);
/** Keys never stored in a sample, even when sampling is on. */
exports.REDACTED = /^(password|secret|token|credentials?|key|authorization|cookie)$/i;
/** Serialized size cap of a single sample. */
exports.SAMPLE_LIMIT = 4096;
//# sourceMappingURL=const.js.map