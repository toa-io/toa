const { load } = require('@kookaburra/explorer');
const { Locator, Runtime, State, Schema } = require('@kookaburra/runtime');
const connector = require('./connector');
const invocation = require('./invocation');
const manifest = require('./manifest');
const transport = require('./transport');

module.exports = async (component, source, resolve) => {
    if (typeof component === 'string')
        component = await load(component);

    manifest(component.manifest);

    const locator = new Locator(component.manifest);

    const connectors = [];
    const remotes = {};

    if (component.manifest.operations) {
        if (!component.operations)
            component.operations = [];

        Object.entries(component.manifest.operations).forEach(([name, manifest]) => {
            if (!component.operations.find(operation => operation.name === name))
                component.operations.push({ name, manifest });
        });
    }

    const local = component.operations?.filter((descriptor) => descriptor.algorithm || descriptor.manifest.template).length > 0;

    let host = undefined;

    if (local)
        host = transport(locator);

    let state = undefined;

    if (local && component.manifest.state) {
        const options = {
            max: component.manifest.state.max,
            inserted: component.manifest.state.inserted,
        };

        state = new State(
            connector(locator, component.manifest.state),
            new Schema(component.manifest.state.schema),
            options,
        );

        connectors.push(state);
    }

    if (component.manifest.remotes) {
        if (typeof resolve !== 'function')
            throw new Error('Runtime with dependencies must be created via Composition (boot.compose)');

        for (const remote of component.manifest.remotes) {
            const { name, proxy } = await resolve(remote, source ? undefined : locator);

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

    let client = undefined;
    const remote = component.operations?.filter((descriptor) => !descriptor.algorithm && !descriptor.manifest.template).length > 0;

    if (remote) {
        client = transport(locator, source);
        connectors.push(client);
    }

    const operations = component.operations?.map(invocation(
        locator,
        client,
        state,
        remotes,
        component.manifest.state,
    ));

    return new Runtime(locator, host, operations, connectors);
};
