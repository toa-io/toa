const { load } = require('@kookaburra/explorer');
const { Locator, Runtime, State } = require('@kookaburra/runtime');
const schema = require('./schema');
const connector = require('./connector');
const invocation = require('./invocation');

module.exports = async (path) => {
    const component = await load(path);

    const locator = new Locator(component.manifest.domain, component.manifest.name);

    let state = undefined;

    const connectors = [];

    if (component.manifest.state) {
        const options = {
            collection: collection(component.manifest.state.collection),
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

const collection = (object) => {
    const DEFAULT_LIMIT_DEFAULT = 100;
    const DEFAULT_LIMIT_MAX = 1000;
    const DEFAULT_OMIT_MAX = 10000;

    if (object.limit === undefined)
        object.limit = {};

    if (typeof object.limit !== 'object')
        object.limit = {
            default: object.limit,
            max: object.limit,
        };

    if (!object?.limit.default)
        object.limit.default = DEFAULT_LIMIT_DEFAULT;

    if (!object.limit.max)
        object.limit.max = DEFAULT_LIMIT_MAX;

    if (object.omit === undefined)
        object.omit = {};

    if (typeof object.omit !== 'object')
        object.omit = {
            max: object.omit,
        };

    if (!object.omit.max)
        object.omit.max = DEFAULT_OMIT_MAX;

    return object;
};
