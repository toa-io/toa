"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deployment_1 = require("./deployment");
it('should validate annotation', async () => {
    const wrongType = 'not ok';
    expect(() => (0, deployment_1.deployment)([], wrongType)).toThrow('object');
});
it('should validate values', async () => {
    const manifest = {
        schema: { foo: 'string', bar: 'number' },
        defaults: { foo: 'ok', bar: 0 }
    };
    const locator = { id: 'component' };
    const instances = [{ manifest, locator }];
    const annotation = { [locator.id]: { bar: 'not a number' } };
    expect(() => (0, deployment_1.deployment)(instances, annotation)).toThrow('number');
});
//# sourceMappingURL=deployment.test.js.map