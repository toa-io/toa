const schema = require('./schema');

const algorithm = ({ input }, object) => {
    Object.assign(object, input);
};

module.exports = (state, descriptor) => {
    if (!descriptor.algorithm)
        descriptor.algorithm = algorithm;

    if (!descriptor.manifest)
        descriptor.manifest = {};

    if (!descriptor.manifest.schema)
        descriptor.manifest.schema = schema(state);
};
