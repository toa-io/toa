"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const manifest_1 = require("./manifest");
it('should validate', async () => {
    const missingRequired = {};
    expect(() => {
        (0, manifest_1.manifest)(missingRequired);
    }).toThrow('required');
    const additional = { schema: {}, foo: 'bar' };
    expect(() => {
        (0, manifest_1.manifest)(additional);
    }).toThrow('additional');
    const wrongType = { schema: 'not ok' };
    expect(() => {
        (0, manifest_1.manifest)(wrongType);
    }).toThrow('object');
});
//# sourceMappingURL=manifest.test.js.map