const clone = require('clone');

const parentSchema = {
    properties: {
        a: {
            type: 'number',
        },
        b: {
            type: 'string',
        },
        foo: {
            type: 'boolean',
        },
    },
};

const schema = {
    properties: {
        a: {
            type: 'number',
        },
        b: 'string',
        c: {
            $ref: './#/properties/a',
        },
        d: './#/properties/a',
        e: '~b',
        foo: '~',
    },
};

const fixedSchema = clone(schema);

Object.assign(fixedSchema.properties, {
    b: { type: 'string' },
    c: { $ref: './#/properties/a' },
    d: { $ref: './#/properties/a' },
    e: { $ref: './#/properties/b' },
    foo: { $ref: './#/properties/foo' },
});


const Schema = jest.fn((schema) => {
    this.schema = schema;
});

module.exports = { schema, fixedSchema, parentSchema, Schema };
