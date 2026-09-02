"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IO = void 0;
const Output_js_1 = require("./Output.js");
const Input_js_1 = require("./Input.js");
const Throttle_js_1 = require("./Throttle.js");
const index_js_1 = require("./lib/throttle/index.js");
class IO {
    name = 'io';
    mandatory = true;
    /** Throttling reconciles through a component, because only a component has an atom aspect. */
    sync = null;
    // eslint-disable-next-line max-params
    create(name, value, remotes, route) {
        if (!(name in constructors))
            throw new Error(`Directive 'io:${name}' is not implemented`);
        const Directive = constructors[name];
        Directive.validate(value);
        // discovering boots the component, so nothing is discovered until something throttles
        if (name === 'throttle')
            this.sync ??= new index_js_1.Sync(remotes.discover('exposition', 'atom'));
        return new Directive(value, this.sync, route);
    }
    preflight(directives, context, parameters) {
        let restricted = false;
        for (const directive of directives) {
            restricted ||= directive instanceof Output_js_1.Output;
            directive.preflight(context, parameters);
        }
        if (!restricted)
            DENIAL.preflight(context, parameters);
        return null;
    }
    settle(directives, context, output) {
        for (const directive of directives)
            directive.settle?.(context, output);
    }
    /**
     * The ticker belongs to the family rather than to any route's directives, and the
     * factory disposes every route it made — so this runs once per route at shutdown,
     * and disposing an already stopped ticker is what makes that harmless.
     */
    dispose() {
        this.sync?.dispose();
    }
}
exports.IO = IO;
const constructors = {
    input: Input_js_1.Input,
    output: Output_js_1.Output,
    throttle: Throttle_js_1.Throttle
};
const DENIAL = new Output_js_1.Output([]);
//# sourceMappingURL=IO.js.map