const clone = require('clone');

const schema = {
    properties: {
        a: {
            type: 'number',
        },
        b: 'string',
    },
};

const fixedSchema = clone(schema);
fixedSchema.properties.b = { type: 'string' };

const Schema = jest.fn((schema) => {
    this.schema = schema;
});

module.exports = { schema, fixedSchema, Schema }
