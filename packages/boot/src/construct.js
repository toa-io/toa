const { load } = require('@kookaburra/explorer');
const { Locator, Runtime, State } = require('@kookaburra/runtime');
const schema = require('./schema');
const connector = require('./connector');
const invocation = require('./invocation');

module.exports = async (path) => {
    const component = await load(path);

    const locator = new Locator(component.manifest.domain, component.manifest.name);

    const starters = [];
    let state = undefined;

    if (component.manifest.state) {
        state = new State(connector(locator, component.manifest.state), schema(component.manifest.state.schema));
        starters.push(state);
    }

    const operations = component.operations.map(invocation(locator, state));
    return new Runtime(locator, operations, starters);
};
