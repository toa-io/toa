const schema = require('./schema');

async function transition({ input }, object) {
    Object.assign(object, input);
}

module.exports = (state, descriptor) => {
    if (!descriptor.algorithm)
        descriptor.algorithm = transition;

    if (!descriptor.manifest)
        descriptor.manifest = {};

    if (!descriptor.manifest.schema)
        descriptor.manifest.schema = schema(state);

    if (!descriptor.manifest)
        descriptor.manifest = {};

    if (!descriptor.manifest.http)
        descriptor.manifest.http = [{ path: '/{_id}' }];
};
