const clone = require('clone');

const string = () => Math.random().toString(36).substring(2);

const path = string();

const operations = [
    {
        name: 'test',
        algorithm: jest.fn(),
        descriptor: {
            schema: {
                properties: {
                    a: {
                        type: 'number',
                    },
                },
            },
        },
    },
];

const manifest = {
    domain: string(),
    name: string(),
    state: {
        schema: {
            properties: {
                a: {
                    type: 'number',
                },
            },
        },
        collection: {
            select: 1000,
            projection: ['a'],
        },
        object: {
            projection: ['a', 'b'],
        },

    },
};

const parsedManifest = clone(manifest);

parsedManifest.state.collection.select = {
    default: 1000,
    limit: 1000,
};

parsedManifest.state.name = parsedManifest.domain;

const load = jest.fn(() => ({
    manifest: clone(manifest),
    operations: clone(operations),
}));

const Locator = jest.fn(function () {
    this.instance = string();
});

const Runtime = jest.fn(function () {
    this.instance = string();
});

const State = jest.fn(function () {
    this.instance = string();
});

module.exports = { path, operations, manifest, parsedManifest, load, Locator, Runtime, State };
