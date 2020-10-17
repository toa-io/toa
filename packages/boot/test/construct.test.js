const mock = require('./fixtures/construct');

jest.mock('@kookaburra/explorer', () => ({
    load: mock.load,
}));

jest.mock('@kookaburra/runtime', () => ({
    Locator: mock.Locator,
    Runtime: mock.Runtime,
    State: mock.State,
}));

jest.mock('../src/schema',
    () => jest.fn(() => Math.random()));
jest.mock('../src/connector',
    () => jest.fn(() => Math.random()));
jest.mock('../src/invocation',
    () => jest.fn(() => jest.fn(() => Math.random())));

const schema = require('../src/schema');
const connector = require('../src/connector');
const invocation = require('../src/invocation');

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

    const invocations = invocation.mock.results.map(f => f.value.mock.results[0].value);
    expect(mock.Runtime.mock.calls[0][1]).toEqual(invocations);

    expect(mock.Runtime.mock.calls[0][2]).toEqual(mock.State.mock.instances);
});

it('should create Locator', () => {
    expect(mock.Locator)
        .toBeCalledWith(mock.manifest.domain, mock.manifest.name);
});

it('should create State', () => {
    const options = {
        collection: mock.manifest.state.collection,
        object: mock.manifest.state.object,
    };

    expect(mock.State)
        .toBeCalledWith(
            connector.mock.results[0].value,
            schema.mock.results[0].value,
            options
            );
});

it('should call connector', () => {
    expect(connector)
        .toBeCalledWith(mock.Locator.mock.instances[0], mock.manifest.state);
});

it('should call schema', () => {
    expect(schema).toBeCalledWith(mock.manifest.state.schema);
});
