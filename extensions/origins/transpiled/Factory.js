"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Factory = void 0;
const msgpackr_1 = require("msgpackr");
const pointer_1 = require("@toa.io/pointer");
const generic_1 = require("@toa.io/generic");
const protocols_1 = require("./protocols");
const extension_1 = require("./extension");
class Factory {
    aspect(locator, manifest) {
        return protocols_1.protocols.map((protocol) => this.createAspect(locator, manifest, protocol));
    }
    createAspect(locator, manifest, protocol) {
        const resolver = this.resolver(locator, manifest, protocol);
        return protocol.create(resolver);
    }
    resolver(locator, manifest, protocol) {
        return (0, generic_1.memo)(async () => {
            const uris = await this.getURIs(locator, manifest);
            const allProperties = this.getProperties(locator);
            const origins = this.filterOrigins(uris, protocol.protocols);
            const properties = allProperties['.' + protocol.id] ?? {};
            return { origins, properties };
        });
    }
    async getURIs(locator, manifest) {
        const map = {};
        if (manifest === null)
            return map;
        for (const [name, value] of Object.entries(manifest))
            map[name] = value !== null ? [value] : await this.readOrigin(locator, name);
        return map;
    }
    filterOrigins(uris, protocols) {
        const filtered = {};
        for (const [name, references] of Object.entries(uris)) {
            const url = new URL(references[0]);
            if (protocols.includes(url.protocol))
                filtered[name] = references;
        }
        return filtered;
    }
    async readOrigin(locator, name) {
        const id = extension_1.ID_PREFIX + locator.label;
        return await (0, pointer_1.resolve)(id, name);
    }
    getProperties(locator) {
        const variable = extension_1.ENV_PREFIX + locator.uppercase + extension_1.PROPERTIES_SUFFIX;
        const value = process.env[variable];
        if (value === undefined)
            return {};
        const buffer = Buffer.from(value, 'base64');
        return (0, msgpackr_1.decode)(buffer);
    }
}
exports.Factory = Factory;
//# sourceMappingURL=Factory.js.map