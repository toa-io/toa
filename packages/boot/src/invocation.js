const { Invocation, Endpoint, Operation } = require('@kookaburra/runtime');
const schema = require('./schema');

module.exports = (locator, state, stateSchema) => (descriptor) => {
    const endpoint = new Endpoint(locator, descriptor.name);
    const operation = new Operation(endpoint, descriptor.algorithm, state);

    return new Invocation(operation, schema(descriptor.manifest?.schema, stateSchema));
};
