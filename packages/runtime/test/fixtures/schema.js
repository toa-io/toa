const bDefault = Math.random().toString();

const schema = {
    properties: {
        a: {
            type: 'number',
            maximum: 100,
            minimum: 1,
        },
        b: {
            type: 'string',
            maxLength: 64,
            default: bDefault,
        },
        c: {
            type: 'string',
            enum: ['one', 'two', 'three']
        }
    },
    required: ['a'],
    unlisted: ['c'],
};

const objects = {
    valid: {
        a: Math.random() * 99 + 1,
        b: Math.random().toString(),
    },
    invalid: {
        a: 101,
    },
    nob: {
        a: Math.random() * 99 + 1,
    },
    noa: {
        b: Math.random().toString(),
    },
    wrongC: {
        a: Math.random() * 99 + 1,
        c: 'four',
    }
};

module.exports = { schema, objects, bDefault };
