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
        const options = {
            collection: collection(component.manifest.state.collection),
            object: component.manifest.state.object,
        };

        state = new State(
            connector(locator, component.manifest.state),
            schema(component.manifest.state.schema),
            options
        );

        starters.push(state);
    }

    const operations = component.operations.map(invocation(locator, state, component.manifest.state.schema));
    return new Runtime(locator, operations, starters);
};

const collection = (object) => {
    if (object.select !== undefined && typeof object.select !== 'object')
        object.select = { limit: object.select, default: object.select };

    if (object.omit !== undefined && typeof object.omit !== 'object')
        object.omit = { limit: object.select };

    return object;
}
