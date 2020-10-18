const schema = require('./schema');

const algorithm = async ({ input, output }, object) => {
    Object.assign(object, input);
    await object._commit();
    output._id = object._id;
};

module.exports = (state, descriptor) => {
    if (!descriptor.algorithm)
        descriptor.algorithm = algorithm;

    if (!descriptor.manifest)
        descriptor.manifest = {};

    if (!descriptor.manifest.schema)
        descriptor.manifest.schema = schema(state);
};
