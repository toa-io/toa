const string = () => Math.random().toString(36).substring(2);

const runtime = {
    operations: {
        [string()]: string(),
        [string()]: string(),
    },
    invoke: jest.fn(),
    start: jest.fn(),
};

const promise = new Promise(resolve => resolve(runtime));

module.exports = { runtime, promise };
