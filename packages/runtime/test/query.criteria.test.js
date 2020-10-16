const parse = require('../src/query/criteria');

it('should parse', () => {
    const ast = {
        type: 'COMPARISON',
        left: { type: 'SELECTOR', selector: 'name' },
        operator: '==',
        right: { type: 'VALUE', value: 'Koo' },
    };

    const criteria = 'name==Koo';

    const properties = {
        name: {
            type: 'string',
        },
    };

    const result = parse(criteria, properties);

    expect(result).toEqual(ast);
});

it('should parse with type coercion', () => {
    const ast = {
        type: 'LOGIC',
        left: {
            type: 'COMPARISON',
            left: { type: 'SELECTOR', selector: 'flag' },
            operator: '==',
            right: { type: 'VALUE', value: true },
        },
        operator: ';',
        right: {
            type: 'COMPARISON',
            left: { type: 'SELECTOR', selector: 'volume' },
            operator: '>',
            right: { type: 'VALUE', value: 2.1 },
        },
    };

    const criteria = 'flag==true;volume>2.1';

    const properties = {
        flag: {
            type: 'boolean',
        },
        volume: {
            type: 'number',
        },
    };

    const result = parse(criteria, properties);

    expect(result).toEqual(ast);
});
