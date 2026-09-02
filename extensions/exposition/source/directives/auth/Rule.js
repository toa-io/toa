"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rule = void 0;
class Rule {
    directives = [];
    constructor(directives, create) {
        for (const [name, value] of Object.entries(directives)) {
            const directive = create(name, value);
            this.directives.push(directive);
        }
    }
    async authorize(identity, context, parameters) {
        for (const directive of this.directives) {
            const authorized = await directive.authorize(identity, context, parameters);
            if (!authorized)
                return false;
        }
        return true;
    }
}
exports.Rule = Rule;
//# sourceMappingURL=Rule.js.map