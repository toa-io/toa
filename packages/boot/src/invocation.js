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

    const meta = {};

    if (descriptor.manifest.http !== undefined) {
        if (typeof descriptor.manifest.http === 'string')
            descriptor.manifest.http = [{ path: descriptor.manifest.http }];

        meta.http = descriptor.manifest.http.map(binding => {
            if (typeof binding === 'string')
                return { path: binding };

            return binding;
        });
    }

    const endpoint = new Endpoint(locator, descriptor.name);
    const operation = new Operation(meta, endpoint, descriptor.algorithm, state);

    return new Invocation(operation, schema(descriptor.manifest?.schema, stateManifest.schema));
};
