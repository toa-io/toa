"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tree = void 0;
const factory_js_1 = require("./factory.js");
const segment_js_1 = require("./segment.js");
class Tree {
    root;
    trunk;
    endpoints;
    directives;
    constructor(node, endpoints, directives) {
        this.endpoints = endpoints;
        this.directives = directives;
        this.root = node;
        this.trunk = this.createNode(node, PROTECTED);
    }
    match(path) {
        if (path === '/')
            return {
                node: this.trunk,
                parameters: []
            };
        const fragments = (0, segment_js_1.fragment)(path);
        return this.trunk.match(fragments);
    }
    merge(node, extension) {
        const branch = this.createNode(node, !PROTECTED, extension);
        return this.trunk.merge(branch);
    }
    /**
     * Extends the expiration of an already merged branch, leaving its endpoints
     * and their remotes intact.
     */
    refresh(nodes) {
        const expiration = Date.now() + (0, factory_js_1.branchTTL)();
        for (const node of nodes)
            node.touch(expiration);
    }
    dispose() {
        this.directives.dispose();
    }
    createNode(node, protect, extension) {
        const context = {
            protected: protect,
            endpoints: this.endpoints,
            directives: {
                factory: this.directives,
                // A merged branch is mounted under the root, so it inherits the root's
                // directives. The trunk is the root: createNode adds them itself, and
                // seeding them here too would apply every one of them twice.
                stack: node === this.root ? [] : this.root.directives ?? []
            },
            path: label(extension),
            extension
        };
        return (0, factory_js_1.createNode)(node, context);
    }
}
exports.Tree = Tree;
/**
 * A branch's routes are relative to wherever it is merged, and the mount point is not
 * known while it is being built — so the component it came from is what keeps two
 * branches from looking like the same route.
 */
function label(extension) {
    if (extension === null || typeof extension !== 'object')
        return '';
    const { namespace, component } = extension;
    return typeof namespace === 'string' && typeof component === 'string'
        ? `${namespace}.${component}`
        : '';
}
const PROTECTED = true;
//# sourceMappingURL=Tree.js.map