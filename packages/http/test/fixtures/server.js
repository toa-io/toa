const string = () => Math.random().toString(36).substring(2);

const iterator = jest.fn();

const verb = jest.fn(() => string());
const path = jest.fn(() => string());
const bind = jest.fn(() => 1);

const operations = [
    {
        id: string(),
        bindings: [string(), string()],
    },
    {
        id: string(),
        bindings: [string(), string()],
    },
];

const server = {
    close: jest.fn(),
};

const express = jest.fn(() => ({
    id: string(),
    use: jest.fn(),
    set: jest.fn(),
    listen: jest.fn(() => server),
    disable: jest.fn(),
}));

express.json = jest.fn();

module.exports = { verb, path, bind, iterator, operations, express, server };
