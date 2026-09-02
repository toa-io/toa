"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.components = exports.standalone = void 0;
exports.deployment = deployment;
exports.parse = parse;
const Composition_js_1 = require("./Composition.js");
exports.standalone = true;
var Composition_js_2 = require("./Composition.js");
Object.defineProperty(exports, "components", { enumerable: true, get: function () { return Composition_js_2.components; } });
function deployment(instances, annotation) {
    const routes = [];
    const { resources, ...annotatedRoutes } = annotation ?? {};
    const labels = (0, Composition_js_1.components)().labels;
    if (annotatedRoutes !== undefined)
        routes.push(...parse(annotatedRoutes));
    for (const instance of instances) {
        const completed = {};
        for (const [key, value] of Object.entries(instance.manifest)) {
            const event = instance.locator.id + '.' + key;
            completed[event] = value;
        }
        routes.push(...parse(completed));
    }
    const service = {
        group: 'realtime',
        name: 'streams',
        version: require('../package.json').version,
        components: labels,
        resources,
        variables: [{
                name: 'TOA_REALTIME',
                value: JSON.stringify(routes)
            }]
    };
    return { services: [service], events: routes.map((route) => route.event) };
}
function parse(declaration) {
    const routes = [];
    for (const [event, value] of Object.entries(declaration))
        if (isObject(value)) {
            const properties = Array.isArray(value.key) ? value.key : [value.key];
            routes.push({ event, properties, expose: value.expose });
        }
        else {
            const properties = Array.isArray(value) ? value : [value];
            routes.push({ event, properties });
        }
    return routes;
}
function isObject(value) {
    return typeof value === 'object' && !Array.isArray(value);
}
//# sourceMappingURL=extension.js.map