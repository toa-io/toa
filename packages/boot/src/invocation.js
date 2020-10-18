const clone = require('clone');
const { Invocation, Endpoint, Operation } = require('@kookaburra/runtime');
const schema = require('./schema');

module.exports = (locator, state, stateManifest) => (descriptor) => {
    if (typeof descriptor.manifest === 'string')
        descriptor.manifest = { template: descriptor.manifest };

    if (descriptor.manifest === null)
        descriptor.manifest = { template: descriptor.name };

    if (descriptor.manifest.template !== undefined) {
        if (typeof descriptor.manifest.template === 'string')
            descriptor.manifest.template = { operation: descriptor.manifest.template };

        if (descriptor.manifest.template === null)
            descriptor.manifest.template = { operation: descriptor.name };


        const module = descriptor.manifest.template.module || '@kookaburra/templates';
        const name = descriptor.manifest.template.operation;

        const template = require(module)[name];

        template(clone(stateManifest), descriptor);
    }

    const endpoint = new Endpoint(locator, descriptor.name);
    const operation = new Operation(endpoint, descriptor.algorithm, state);

    return new Invocation(operation, schema(descriptor.manifest?.schema, stateManifest.schema));
};
