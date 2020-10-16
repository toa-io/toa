const operation = {
    invoke: jest.fn((a, b) => a + b),
    endpoint: { name: Math.random().toString() },
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
