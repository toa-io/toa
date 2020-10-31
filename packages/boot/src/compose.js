const path = require('path');
const explorer = require('@kookaburra/explorer');
const { Locator, Proxy } = require('@kookaburra/runtime');
const construct = require('./construct');

module.exports = async (pth) => {
    const proxies = {};

    // this solves circular dependencies
    const resolve = (remote) => async (ref, source) => {
        const location = path.resolve(pth, ref || '');
        const component = await explorer[remote ? 'read' : 'load'](location);
        const name = new Locator(component.manifest).label;

        if (proxies[name])
            return { name, proxy: proxies[name] };

        const promise = construct(component, source, resolve(true));
        const proxy = new Proxy(promise);

        proxies[name] = proxy;

        return { name, proxy, promise };
    };

    const { promise } = await resolve(false)();

    return await promise;
};
