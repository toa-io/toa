const { load } = require('@kookaburra/explorer');
const { Locator, Runtime, State } = require('@kookaburra/runtime');
const schema = require('./schema');
const connector = require('./connector');
const invocation = require('./invocation');
const query = require('./query');

module.exports = async (path) => {
    const component = await load(path);

    const locator = new Locator(component.manifest.domain, component.manifest.name);

    let state = undefined;

    const connectors = [];

    if (component.manifest.state) {
        const options = {
            collection: query(component.manifest.state.collection),
            object: component.manifest.state.object,
        };

        if (!component.manifest.state.name)
            component.manifest.state.name = component.manifest.domain;

        state = new State(
            connector(locator, component.manifest.state),
            schema(component.manifest.state.schema),
            options,
        );

        connectors.push(state);
    }

    Object.entries(component.manifest.operations).forEach(([name, manifest]) => {
        if (!component.operations.find(operation => operation.name === name))
            component.operations.push({ name, manifest });
    });

    const operations = component.operations.map(invocation(locator, state, component.manifest.state));
    return new Runtime(locator, operations, connectors);
};
