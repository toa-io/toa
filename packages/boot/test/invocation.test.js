const mock = require('./fixtures/invocation');

jest.mock('@kookaburra/runtime', () => ({
    Invocation: mock.Invocation,
    Endpoint: mock.Endpoint,
    Operation: mock.Operation,
}));

jest.mock('../src/schema',
    () => jest.fn(() => 1));
const schema = require('../src/schema');

const invocation = require('../src/invocation');

let result = undefined;

beforeEach(() => {
    jest.resetAllMocks();

    result = invocation(mock.locator, mock.state, mock.stateSchema)(mock.descriptor);
});

it('should return Invocation', () => {
    expect(result).toBeInstanceOf(mock.Invocation);
    expect(mock.Invocation).toBeCalledTimes(1);
});

it('should create Invocation', () => {
    const operation = mock.Operation.mock.instances[0];

    expect(mock.Invocation).toBeCalledTimes(1);
    expect(mock.Invocation).toBeCalledWith(operation, schema.mock.results[0].value);
});

it('should call schema', () => {
    expect(schema).toBeCalledTimes(1);
    expect(schema).toBeCalledWith(mock.descriptor.manifest.schema, mock.stateSchema);
});

it('should create Operation', () => {
    expect(mock.Operation).toBeCalledTimes(1);
    expect(mock.Operation)
        .toBeCalledWith(mock.Endpoint.mock.instances[0], mock.descriptor.algorithm, mock.state)
});

it('should create Endpoint', () => {
    expect(mock.Endpoint).toBeCalledTimes(1);
    expect(mock.Endpoint).toBeCalledWith(mock.locator, mock.descriptor.name);
});
