"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Control = void 0;
const matchacho_1 = require("matchacho");
class Control {
    value;
    control = null;
    vary = false;
    constructor(value) {
        this.value = value;
    }
    static disabled(headers) {
        const value = headers.get('cache-control');
        if (value === null)
            return false;
        const directives = mask(value);
        return (directives & NO_STORE) === NO_STORE;
    }
    set(context, headers) {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(context.request.method))
            return;
        this.control ??= this.resolve(context);
        if (Control.disabled(headers))
            return;
        headers.set('cache-control', this.control);
        if (this.vary)
            headers.append('vary', 'authorization');
    }
    resolve(request) {
        if (request.identity === null)
            return this.value;
        const directives = mask(this.value);
        if ((directives & PRIVATE) === PRIVATE)
            this.vary = true;
        if ((directives & (PUBLIC | NO_CACHE)) === PUBLIC)
            return 'no-cache, ' + this.value;
        if ((directives & (PUBLIC | PRIVATE)) === 0) {
            this.vary = true;
            return 'private, ' + this.value;
        }
        return this.value;
    }
}
exports.Control = Control;
function mask(value) {
    const directives = value.match(DIRECTIVES_RX);
    if (directives === null)
        return 0;
    let mask = 0;
    for (const directive of directives)
        mask |= (0, matchacho_1.match)(directive, 'private', PRIVATE, 'public', PUBLIC, 'no-cache', NO_CACHE, 'no-store', NO_STORE, 0);
    return mask;
}
const DIRECTIVES_RX = /\b(private|public|no-cache|no-store)\b/ig;
const PUBLIC = 1;
const PRIVATE = 2;
const NO_CACHE = 4;
const NO_STORE = 8;
//# sourceMappingURL=Control.js.map