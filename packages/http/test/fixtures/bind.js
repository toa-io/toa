const string = () => Math.random().toString(36).substring(2);

const query = jest.fn();

const app = {
    get: jest.fn(),
};

const verb = 'get';
const route = string();
const binding = string();

const statuses = {
    error: 4,
};

const exception = new Error(string());

const operation = {
    invoke: jest.fn((input) => {
        const io = {};

        if (input.exception)
            throw exception;

        if (input.error)
            io.error = { status: statuses.error, message: string() };

        if (!input.empty)
            io.output = string();

        return io;
    }),
};

const req = {
    body: string(),
};

const res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    end: jest.fn(() => res),
};

module.exports = { query, app, verb, route, binding, operation, req, res, statuses, exception };
