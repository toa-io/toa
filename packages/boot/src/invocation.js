const clone = require('clone');
const { Invocation, Endpoint, Schema, Operation, Call } = require('@kookaburra/runtime');

module.exports = (locator, transporter, state, remotes, stateManifest) => (descriptor) => {
    if (descriptor.manifest === undefined)
        descriptor.manifest = {};

    if (descriptor.manifest.template !== undefined) {
        const module = require(descriptor.manifest.template.package);
        const template = module[descriptor.manifest.template.name];

        template(clone(stateManifest), descriptor);
    }

    const meta = {
        http: descriptor.manifest.http,
    };

    const endpoint = new Endpoint(locator, descriptor.name);


    const operation = descriptor.algorithm
        ? new Operation(endpoint, meta, descriptor.algorithm, state, remotes)
        : new Call(endpoint, transporter);

    return new Invocation(operation, new Schema(descriptor.manifest?.schema, stateManifest.schema));
};
