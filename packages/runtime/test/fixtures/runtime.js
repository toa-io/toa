const string = () => Math.random().toString(36).substring(2);

const output = { result: string() };
const error = { message: string() };

const operation = () => ({
    endpoint: {
        name: string(),
    },
    invoke: jest.fn((io) => {
        if (!io.input.error)
            Object.assign(io.output, output);
        else
            Object.assign(io.error, error);
    }),
});

const locator = { label: string() };
const operations = [1, 2, 3].map(operation);

const connectors = [
    {
        connect: jest.fn().mockResolvedValue(1),
        disconnect: jest.fn().mockResolvedValue(1),
    },
    {
        connect: jest.fn().mockResolvedValue(1),
        disconnect: jest.fn().mockResolvedValue(1),
    },
];

const input = { prop: string() };
const query = { prop: string() };

module.exports = { locator, operations, connectors, input, query, output, error };
