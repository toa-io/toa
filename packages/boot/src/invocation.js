const clone = require('clone');
const { Invocation, Endpoint, Operation } = require('@kookaburra/runtime');
const schema = require('./schema');

module.exports = (locator, state, remotes, stateManifest) => (descriptor) => {
    if (descriptor.manifest === undefined)
        descriptor.manifest = {};

    if (descriptor.manifest.template !== undefined) {
        const template = require(descriptor.manifest.template.package)[descriptor.manifest.template.name];
        template(clone(stateManifest), descriptor);
    }

    const meta = {
        http: descriptor.manifest.http
    };

    const endpoint = new Endpoint(locator, descriptor.name);
    const operation = new Operation(endpoint, meta, descriptor.algorithm, state, remotes);

    return new Invocation(operation, schema(descriptor.manifest?.schema, stateManifest.schema));
};
