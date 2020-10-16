const endpoint = { name: Math.random().toString() };

const io = () => ({ input: {}, output: {}, error: {} });

const query = {
    criteria: 'year>2020',
};

const state = {
    object: jest.fn((query) =>
        (query?.notFound ? null : {
            _id: Math.random().toString(),
            _commit: jest.fn(() => !query?.persistenceError),
        })),

    collection: jest.fn(() => ([{ _id: Math.random().toString() }])),
};

const algorithm = ({ input, output }, object) => ({ input, output, object });

module.exports = { endpoint, io, query, state, algorithm };
