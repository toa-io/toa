const algorithm = (name) => async ({ output }, collection) => {
    output[name] = collection;
};

module.exports = (state, descriptor) => {
    if (!descriptor.algorithm)
        descriptor.algorithm = algorithm(state.name);
};
