"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortcuts = exports.DirectivesFactory = exports.Directives = void 0;
const openspan_1 = require("openspan");
class Directives {
    sets;
    /** the span of a stage depends only on the set, so it is built once per route */
    spans;
    constructor(sets) {
        this.sets = sets;
        this.spans = sets.map((set) => ({
            preflight: options(set, 'preflight'),
            settle: options(set, 'settle')
        }));
    }
    async preflight(context, parameters) {
        let output = null;
        for (let i = 0; i < this.sets.length; i++) {
            const set = this.sets[i];
            if (set.family.preflight === undefined)
                continue;
            const out = await openspan_1.console.span(this.spans[i].preflight, async () => await set.family.preflight(set.directives, context, parameters));
            if (out === null)
                continue;
            if (output !== null)
                throw new Error('Multiple preflight directives responded');
            else
                output = out;
        }
        return output;
    }
    async settle(context, response) {
        for (let i = 0; i < this.sets.length; i++) {
            const set = this.sets[i];
            if (set.family.settle !== undefined)
                await openspan_1.console.span(this.spans[i].settle, async () => await set.family.settle(set.directives, context, response));
        }
    }
    dispose() {
        for (const set of this.sets)
            set.family.dispose?.(set.directives);
    }
}
exports.Directives = Directives;
class DirectivesFactory {
    remotes;
    families = {};
    mandatory = [];
    instances = [];
    constructor(families, remotes) {
        for (const family of families) {
            this.families[family.name] = family;
            if (family.mandatory)
                this.mandatory.push(family.name);
        }
        this.remotes = remotes;
    }
    create(declarations, route = '') {
        const groups = {};
        const mandatory = new Set(this.mandatory);
        const names = {};
        for (const declaration of declarations) {
            const family = this.families[declaration.family];
            if (family === undefined)
                throw new Error(`Directive family '${declaration.family}' is not found`);
            const directive = family.create(declaration.name, declaration.value, this.remotes, route);
            groups[family.name] ??= [];
            groups[family.name].push(directive);
            names[family.name] ??= [];
            names[family.name].push(`${declaration.family}:${declaration.name}`);
            mandatory.delete(family.name);
        }
        const sets = [];
        for (const family of mandatory)
            sets.push({
                family: this.families[family],
                directives: [],
                names: []
            });
        for (const [family, directives] of Object.entries(groups))
            sets.push({
                family: this.families[family],
                directives,
                names: names[family]
            });
        // Mandatory families run in the order they are registered in, not in the order a
        // manifest happens to mention them: `auth` must resolve the identity before `io`
        // can key a quota on it, and a request it denies should not reach `io` at all.
        // The rest keep the order they were declared in, the sort being stable.
        sets.sort((a, b) => this.rank(a.family.name) - this.rank(b.family.name));
        // whatever order a family needs among its own directives is fixed here, not per request
        for (const set of sets)
            set.family.arrange?.(set.directives);
        const directives = new Directives(sets);
        this.instances.push(directives);
        return directives;
    }
    dispose() {
        for (const directives of this.instances)
            directives.dispose();
    }
    /** Mandatory families first, in their own order; everything else keeps its own. */
    rank(family) {
        const index = this.mandatory.indexOf(family);
        return index === -1 ? this.mandatory.length : index;
    }
}
exports.DirectivesFactory = DirectivesFactory;
function options(set, stage) {
    const options = { name: `${set.family.name} ${stage}` };
    if (set.names !== undefined && set.names.length > 0)
        options.attributes = { directives: Array.from(new Set(set.names)).join(' ') };
    return options;
}
exports.shortcuts = new Map([
    ['anonymous', 'auth:anonymous'],
    ['anyone', 'auth:anyone'],
    ['id', 'auth:id'],
    ['role', 'auth:role'],
    ['rule', 'auth:rule'],
    ['incept', 'auth:incept'],
    ['input', 'io:input'],
    ['output', 'io:output'],
    ['languages', 'map:languages']
]);
//# sourceMappingURL=Directive.js.map