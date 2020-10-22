const { load } = require('@kookaburra/explorer');
const { Locator, Runtime, State } = require('@kookaburra/runtime');
const schema = require('./schema');
const connector = require('./connector');
const invocation = require('./invocation');
const manifest = require('./manifest');

module.exports = async (component, resolve) => {
    if (typeof component === 'string')
        component = await load(component);

    manifest(component.manifest);

    const locator = new Locator(component.manifest);

    let state = undefined;

    const connectors = [];
    const remotes = {};

    if (component.manifest.state) {
        const options = {
            max: component.manifest.state.max,
        };

        state = new State(
            connector(locator, component.manifest.state),
            schema(component.manifest.state.schema),
            options,
        );

        connectors.push(state);
    }

    if (component.manifest.remotes) {
        if (typeof resolve !== 'function')
            throw new Error('Runtime with dependencies must be created via Composition (boot.compose)');

        for (const remote of component.manifest.remotes) {
            const { name, proxy } = await resolve(remote);

            const segments = name.split('.');
            const last = segments.pop();

            let cursor = remotes;

            for (const segment of segments) {
                cursor[segment] = {};
                cursor = cursor[segment];
            }

            cursor[last] = proxy;

            connectors.push(proxy);
        }
    }

    if (component.manifest.operations) {
        if (!component.operations)
            component.operations = [];

        Object.entries(component.manifest.operations).forEach(([name, manifest]) => {
            if (!component.operations.find(operation => operation.name === name))
                component.operations.push({ name, manifest });
        });
    }

    const operations = component.operations?.map(invocation(locator, state, remotes, component.manifest.state));

    return new Runtime(locator, operations, connectors);
};
