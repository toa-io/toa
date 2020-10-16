const { Schema } = require('@kookaburra/runtime');

module.exports = (schema) => {

    schema.properties = Object.fromEntries(Object.entries(schema.properties)
        .map(([key, value]) => {
            if (typeof value !== 'object')
                value = { type: value };

            return [key, value];
        }));

    return new Schema(schema);
};
