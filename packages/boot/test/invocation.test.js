const mock = require('./fixtures/invocation');

jest.mock('@kookaburra/templates', () => mock.Templates);
const templates = require('@kookaburra/templates');

jest.mock('@kookaburra/runtime', () => ({
    Invocation: mock.Invocation,
    Endpoint: mock.Endpoint,
    Operation: mock.Operation,
    Schema: mock.Schema,
}));

jest.mock('../src/manifest/schema',
    () => jest.fn(() => 1));

const invocation = require('../src/invocation');

let result = undefined;

beforeEach(() => {
    jest.clearAllMocks();

    result = invocation(mock.locator, mock.transporter, mock.state, mock.remotes, mock.stateManifest)(mock.descriptor);
});

it('should return Invocation', () => {
    expect(result).toBeInstanceOf(mock.Invocation);
    expect(mock.Invocation).toBeCalledTimes(1);
});

it('should create Invocation', () => {
    const operation = mock.Operation.mock.instances[0];

    expect(mock.Invocation).toBeCalledTimes(1);
    expect(mock.Invocation).toBeCalledWith(operation, mock.Schema.mock.instances[0]);
});

it('should create Operation', () => {
    expect(mock.Operation).toBeCalledTimes(1);
    expect(mock.Operation)
        .toBeCalledWith(mock.Endpoint.mock.instances[0], mock.meta, mock.descriptor.algorithm, mock.state, mock.remotes);
});

it('should create Endpoint', () => {
    expect(mock.Endpoint).toBeCalledTimes(1);
    expect(mock.Endpoint).toBeCalledWith(mock.locator, mock.descriptor.name);
});

describe('template', () => {

    it('should use template', () => {
        const descriptor = {
            name: 'get',
            manifest: {
                template: {
                    package: '@kookaburra/templates',
                    name: 'get',
                },
            },
        };

        invocation(mock.locator, mock.transporter, mock.state, [], mock.stateManifest)(descriptor);

        expect(templates.get).toBeCalledTimes(1);
        expect(templates.get).toBeCalledWith(mock.stateManifest, descriptor);
    });

});

