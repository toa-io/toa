const string = () => Math.random().toString(36).substring(2);

const operation = {
    invoke: jest.fn((a, b) => a + b),
    endpoint: { name: string() },
    type: string(),
    access: string(),
    http: { path: string() },
};

const schema = {
    fit: jest.fn((object) => !object?.error),
    error: Math.random().toString(),
    errors: [{ prop: Math.random() }, { prop: Math.random() }],
};

const io = () => ({
    input: {
        a: Math.random(),
        b: Math.random(),
    },
    output: {},
    error: {},
});

const query = {
    prop: Math.random(),
};

module.exports = { operation, schema, io, query };
