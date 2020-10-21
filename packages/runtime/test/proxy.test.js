const mock = require('./fixtures/proxy');

const Proxy = require('../src/proxy');

let proxy = undefined;

beforeEach(() => {
    proxy = new Proxy(mock.promise);
});

it('should be connector', () => {
    expect(proxy.connect).toBeInstanceOf(Function);
});

describe('connect', () => {

    beforeEach(async () => {
        await proxy.connect();
    });

    it('should start proxied runtime', () => {
        expect(mock.runtime.start).toBeCalledTimes(1);
    });

    it('should proxy runtime`s operations', () => {
        const arg1 = 'foo';
        const arg2 = 'bar';

        for (const [name, value] of Object.entries(mock.runtime.operations)) {
            expect(proxy[name]).toBeInstanceOf(Function);

            proxy[name](arg1, arg2);

            expect(mock.runtime.invoke).toBeCalledWith(value, arg1, arg2);
        }
    });

    it('should provide only runtime`s operations', () => {
        for (const key of Object.keys(proxy))
            expect(mock.runtime.operations[key]).toBeDefined();
    });

});
