module.exports = (state) => {
    const schema = {};

    if (state.object?.projection) {
        schema.properties = Object.fromEntries(
            state.object.projection.map(name => [name, state.schema.properties[name]])
        );
    } else if (state.schema?.properties)
        schema.properties = state.schema.properties;

    if (state.schema?.required)
        schema.required = state.schema.required.filter(
            (p) => state.object?.projection ? state.object?.projection.includes(p) : true
        );

    return Object.keys(schema).length ? schema : undefined;
};
