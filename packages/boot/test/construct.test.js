const mock = require('./fixtures/construct');

jest.mock('@kookaburra/explorer', () => ({
    load: mock.load,
}));

jest.mock('@kookaburra/runtime', () => ({
    Locator: mock.Locator,
    Runtime: mock.Runtime,
    State: mock.State,
    Schema: mock.Schema,
}));

jest.mock('../src/connector',
    () => jest.fn(() => Math.random()));
jest.mock('../src/invocation',
    () => jest.fn(() => mock.invocation));
jest.mock('../src/transport',
    () => jest.fn(() => mock.transport));

const connector = require('../src/connector');
const invocation = require('../src/invocation');
const transport = require('../src/transport');

const construct = require('../src/construct');

let runtime = undefined;

beforeEach(async () => {
    jest.clearAllMocks();

    runtime = await construct(mock.path);
});

it('should return Runtime', () => {
    expect(runtime).toBeInstanceOf(mock.Runtime);
    expect(mock.Runtime).toBeCalledTimes(1);
});

it('should create Runtime', () => {
    expect(mock.Runtime.mock.calls[0][0]).toEqual(mock.Locator.mock.instances[0]);

    const invocations = invocation.mock.results[0].value.mock.results.map(f => f.value);
    expect(mock.Runtime.mock.calls[0][1]).toEqual(invocations);

    expect(mock.Runtime.mock.calls[0][2]).toEqual(mock.State.mock.instances);
});

it('should create Locator', () => {
    expect(mock.Locator).toBeCalledTimes(1);
});

it('should create State', () => {
    expect(mock.State)
        .toBeCalledWith(
            connector.mock.results[0].value,
            mock.Schema.mock.instances[0],
            { max: mock.parsedManifest.state.max }
        );
});

it('should call connector', () => {
    expect(connector.mock.calls[0][0])
        .toEqual(mock.Locator.mock.instances[0]);
});

it('should create operations from templates', () => {
    expect(mock.invocation).toBeCalledTimes(2);
    expect(mock.invocation.mock.calls[1][0])
        .toMatchObject(expect.objectContaining({ manifest: mock.manifest.operations.get }));
});

it('should not load component if passed', async () => {
    jest.clearAllMocks();
    await construct(mock.component, undefined, mock.resolve);

    expect(mock.load).toBeCalledTimes(0);
});

it('should resolve remotes', async () => {
    jest.clearAllMocks();

    await construct({
        manifest: {
            remotes: mock.remotes,
        },
    }, undefined, mock.resolve);

    expect(mock.resolve).toBeCalledTimes(mock.remotes.length);

    let i = 0;

    for (const remote of mock.remotes)
        expect(mock.resolve).toHaveBeenNthCalledWith(++i, remote, mock.Locator.mock.instances[0]);

});
