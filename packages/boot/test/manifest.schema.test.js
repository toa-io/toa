const schema = require('../src/manifest/schema');

it('should resolve shorthanded properties', () => {
    const input = {
        properties: {
            a: 'number',
        },
    };

    schema(input)

    expect(input.properties.a).toEqual({ type: 'number'});
});

it('should resolve shorthanded reference properties', () => {
    const input1 = {
        properties: {
            a: '~'
        }
    };

    const input2 = {
        properties: {
            a: null
        }
    };

    const input3 = {
        properties: {
            a: '~b'
        }
    };

    schema(input1);
    schema(input2);
    schema(input3);

    expect(input1.properties.a).toEqual({ $ref: './#/properties/a'});
    expect(input2.properties.a).toEqual({ $ref: './#/properties/a'});
    expect(input3.properties.a).toEqual({ $ref: './#/properties/b'});
});
