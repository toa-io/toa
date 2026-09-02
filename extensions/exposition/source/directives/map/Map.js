"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Map = void 0;
const matchacho_1 = require("matchacho");
const Properties_js_1 = require("./Properties.js");
const Mapping_js_1 = require("./Mapping.js");
const Headers_js_1 = require("./Headers.js");
const Languages_js_1 = require("./Languages.js");
const Language_js_1 = require("./Language.js");
const Segments_js_1 = require("./Segments.js");
const Authority_js_1 = require("./Authority.js");
const Buffer_js_1 = require("./Buffer.js");
const Claims_js_1 = require("./Claims.js");
class Map {
    name = 'map';
    mandatory = false;
    remotes;
    create(name, value, remotes) {
        this.remotes = remotes;
        return (0, matchacho_1.match)(name, () => Properties_js_1.properties.has(name), (name) => new Properties_js_1.Property(name, value), () => name in mappings, (name) => new mappings[name](value, remotes), () => {
            throw new Error(`Directive 'map:${name}' is not implemented`);
        });
    }
    async preflight(directives, context, parameters) {
        const properties = {};
        for (const directive of directives)
            if (directive instanceof Mapping_js_1.Mapping)
                Object.assign(properties, await directive.properties(context, parameters, directives));
        context.pipelines.body.push((body) => {
            if (body === undefined || body === null || typeof body !== 'object')
                return properties;
            else
                return Object.assign(body, properties);
        });
        return null;
    }
}
exports.Map = Map;
const mappings = {
    authority: Authority_js_1.Authority,
    buffer: Buffer_js_1.BufferMapping,
    headers: Headers_js_1.Headers,
    languages: Languages_js_1.Languages,
    language: Language_js_1.Language,
    segments: Segments_js_1.Segments,
    claims: Claims_js_1.Claims
};
//# sourceMappingURL=Map.js.map