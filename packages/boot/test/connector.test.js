const connector = require('../src/connector');
const mock = require('./fixtures/connector');

jest.mock('@kookaburra/state.mongodb');
const Connector = require('@kookaburra/state.mongodb');

const mockConnector = jest.fn(() => {});

// random existent module name
jest.mock('@kookaburra/explorer', () => mockConnector);

let result = undefined;

beforeEach(() => {
    jest.clearAllMocks();
    result = connector(mock.locator, mock.state, mock.schema);
});

it('should return connector', () => {
    expect(result).toBeInstanceOf(Connector);
});

it('should create Connector', () => {
    const host = mock.locator.host.mock.results[0].value;
    expect(Connector).toBeCalledWith(host, mock.locator.domain, mock.state.name);
});

it('should load provided connector', () => {
    const custom = Object.assign({}, mock.state);

    custom.connector = '@kookaburra/explorer';
    connector(mock.locator, custom, mock.schema);

    expect(mockConnector).toBeCalledTimes(1);
});

it('should load default connector', () => {
    const custom = Object.assign({}, mock.state);

    delete custom.connector;
    connector(mock.locator, custom, mock.schema);

    expect(Connector).toBeCalledTimes(2);
});

it('should throw on unrecognized connector', () => {
    const broken = Object.assign({}, mock.state);

    broken.connector = 'foo';
    expect(() => connector(mock.locator, broken, mock.schema)).toThrow(/Error loading/);
});
