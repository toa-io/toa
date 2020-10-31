const string = () => Math.random().toString(36).substring(2);

const locator = string();
const transporter = { calls: jest.fn() };
const state = { prop: string() };
const stateManifest = { prop: string(), schema: string() };

const descriptor = {
    name: string(),
    algorithm: jest.fn(),
    manifest: {
        schema: string(),
        http: [{
            path: '/',
        }],
    },
};

const Invocation = jest.fn(() => 1);
const Endpoint = jest.fn(() => 1);
const Operation = jest.fn(() => 1);
const Schema = jest.fn(() => 1);

const Templates = {
    get: jest.fn((state, descriptor) => {
        descriptor.algorithm = jest.fn();
    }),
};

const meta = { http: descriptor.manifest.http };

const remotes = [string(), string()];

module.exports = {
    locator, transporter, meta, state, stateManifest, remotes, descriptor,
    Invocation, Endpoint, Operation, Schema, Templates,
};
