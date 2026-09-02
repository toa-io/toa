"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Identity = void 0;
/**
 * The authenticated identity, or nothing when the request carries none.
 *
 * Anonymous requests therefore share one quota between them; `ip` is the component
 * that tells them apart.
 */
class Identity {
    get(context) {
        return context.identity?.id ?? '';
    }
}
exports.Identity = Identity;
//# sourceMappingURL=Identity.js.map