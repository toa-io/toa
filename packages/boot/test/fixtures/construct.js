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
        properties: {
            a: {
                type: 'number',
            },
        },
        collection: {
            projection: ['a'],
        },
        object: {
            projection: ['a', 'b'],
        },
    },
};

const load = jest.fn(() => ({
    manifest,
    operations,
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

module.exports = { path, operations, manifest, load, Locator, Runtime, State };
