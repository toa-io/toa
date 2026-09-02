"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spaces = void 0;
const S3_js_1 = require("./S3.js");
class Spaces extends S3_js_1.S3 {
    static SECRETS = [
        { name: 'ACCESS_KEY_ID' },
        { name: 'SECRET_ACCESS_KEY' }
    ];
    constructor(options, secrets) {
        super({
            bucket: options.space,
            region: options.region,
            endpoint: `https://${options.region}.digitaloceanspaces.com`
        }, secrets);
    }
}
exports.Spaces = Spaces;
//# sourceMappingURL=Spaces.js.map