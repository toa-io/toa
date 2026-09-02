"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manifest = manifest;
function manifest(manifest) {
    if (manifest === null)
        return [];
    if (typeof manifest === 'string')
        return [manifest];
    return manifest;
}
//# sourceMappingURL=manifest.js.map