const path = require('path');
const { load } = require('@kookaburra/explorer');
const { Locator, Proxy } = require('@kookaburra/runtime');
const construct = require('./construct');

module.exports = async (pth) => {
    const proxies = {};

    // this solves circular dependencies
    const resolve = async (ref) => {
        const location = path.resolve(pth, ref || '');
        const component = await load(location);
        const name = new Locator(component.manifest).label;

        if (proxies[name])
            return { name, proxy: proxies[name] };

        const promise = construct(component, resolve);
        const proxy = new Proxy(promise);

        proxies[name] = proxy;

        return { name, proxy, promise };
    };

    const { promise } = await resolve();

    return await promise;
};
