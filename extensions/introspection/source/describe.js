"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describe = describe;
/**
 * Turns a normalized component manifest into the node of the map.
 *
 * Everything here is already normalized by norm: the prototype chain is collapsed,
 * so this is the shape the runtime actually runs.
 */
function describe(manifest) {
    return {
        namespace: manifest.namespace,
        component: manifest.name,
        version: manifest.version,
        entity: entity(manifest),
        operations: operations(manifest),
        events: events(manifest),
        receivers: receivers(manifest),
        // names only: extension declarations carry configuration and secrets
        extensions: Object.keys(manifest.extensions ?? {})
    };
}
function entity(manifest) {
    if (manifest.entity === undefined)
        return null;
    return {
        schema: manifest.entity.schema,
        storage: manifest.entity.storage,
        associated: manifest.entity.associated === true
    };
}
function operations(manifest) {
    return Object.entries(manifest.operations ?? {})
        .map(([endpoint, definition]) => ({
        endpoint,
        type: definition.type,
        scope: definition.scope,
        query: definition.query,
        input: definition.input ?? null,
        output: definition.output ?? null,
        errors: definition.errors ?? []
    }));
}
function events(manifest) {
    return Object.entries(manifest.events ?? {})
        .map(([label, definition]) => ({ label, binding: definition.binding }));
}
/*
 * Receiver labels contain dots (`identity.bans.created`), which is why nodes keep
 * these as arrays rather than maps — a dot in a document key is a hazard in Mongo.
 */
function receivers(manifest) {
    return Object.entries(manifest.receivers ?? {})
        .map(([label, definition]) => ({
        label,
        source: definition.source ?? label.split('.').slice(0, 2).join('.'),
        event: label.split('.').pop(),
        operation: definition.operation,
        conditioned: definition.conditioned === true,
        adaptive: definition.adaptive === true
    }));
}
//# sourceMappingURL=describe.js.map