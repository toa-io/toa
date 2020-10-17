const string = () => Math.random().toString(36).substring(2);

const connector = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(() => ({ _id: string() })),
    initial: jest.fn(() => ({ _id: string() })),
    add: jest.fn((object) => {
        object._id = string();
        return 1;
    }),
    update: jest.fn(() => 1),
    find: jest.fn(() => [{ _id: string() }, { _id: string() }]),
};

const query = {
    criteria: `id==100500`,
};

const ast = {
    left: {
        type: 'SELECTOR',
        selector: 'id',
    },
    type: 'COMPARISON',
    operator: '==',
    right: {
        type: 'VALUE',
        value: '100500',
    },
};

const schema = {
    fit: jest.fn((object) => !object.error),
    error: string(),
    properties: {
        a: {
            type: 'string',
        },
    },
    projection: { 'a': 0 },
};

const parse = jest.fn((query) => {
    if (!query)
        return;

    return query?.criteria ? { criteria: ast } : {};
});

const options = {
    collection: {
        prop: string(),
    },
    object: {
        prop: string(),
    },
};

module.exports = { connector, query, parse, schema, options };
