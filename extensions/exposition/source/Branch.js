"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decide = decide;
/**
 * What to do with an announcement about a component that already has a branch exposed.
 *
 * - `refresh`: the same version, so its expiration is extended and its endpoints left alone
 * - `superseded`: it came from a tenant that started before the one exposed now
 * - `merge`: everything else
 */
function decide(exposed, branch) {
    if (exposed.version === branch.version)
        return 'refresh';
    if (branch.timestamp < exposed.timestamp)
        return 'superseded';
    return 'merge';
}
//# sourceMappingURL=Branch.js.map