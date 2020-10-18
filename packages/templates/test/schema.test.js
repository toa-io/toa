const schema = require('../src/schema');

let state = undefined;

beforeEach(() => {

    state = {
        schema: {
            properties: {
                a: { type: 'number' },
                b: { type: 'string' },
                c: { type: 'boolean' },
            },
            required: ['a', 'c'],
        },
    };

});


it('should return undefined if either state properties nor object projector found', () => {
    const result = schema({});

    expect(result).not.toBeDefined();
});

it('should create properties from object projection', () => {
    state.object = {
        projection: ['a', 'b'],
    };

    const properties = {
        a: { type: 'number' },
        b: { type: 'string' },
    };

    const result = schema(state);

    expect(result.properties).toEqual(properties);
});

it('should create properties from state schema if no object projection found', () => {
    const properties = {
        a: { type: 'number' },
        b: { type: 'string' },
        c: { type: 'boolean' },
    };

    const result = schema(state);

    expect(result.properties).toEqual(properties);
});

it('should create required from required', () => {
    const required = ['a', 'c'];

    const result = schema(state);

    expect(result.required).toEqual(required);
});

it('should create required from required with projection intersection', () => {
    state.object = {
        projection: ['a', 'b'],
    };

    const required = ['a'];

    const result = schema(state);

    expect(result.required).toEqual(required);
});
