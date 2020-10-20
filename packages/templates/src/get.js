async function observation({ input, output }, object) {
    Object.assign(output, object);
}

module.exports = (state, descriptor) => {
    if (!descriptor.algorithm)
        descriptor.algorithm = observation;

    if (!descriptor.manifest)
        descriptor.manifest = {};

    if (!descriptor.manifest.http)
        descriptor.manifest.http = '/{_id}';
};
