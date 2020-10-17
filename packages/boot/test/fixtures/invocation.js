const string = () => Math.random().toString(36).substring(2);

const locator = string();

const state = string();
const stateSchema = string();

const descriptor = {
    name: string(),
    algorithm: jest.fn(),
    manifest: {
        schema: string(),
    }
};

const Invocation = jest.fn(() => {});
const Endpoint = jest.fn(() => {});
const Operation = jest.fn(() => {});

module.exports = { locator, state, stateSchema, descriptor, Invocation, Endpoint, Operation };
