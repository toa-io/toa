const clone = require('clone');

const mock = require('./fixtures/schema');

jest.mock('@kookaburra/runtime', () => ({ Schema: mock.Schema }));

const schema = require('../src/schema');

let result = undefined;

beforeEach(() => {
    jest.clearAllMocks();

    result = schema(clone(mock.schema), mock.parentSchema);
});

it('should return Schema', () => {
    expect(result).toBeInstanceOf(mock.Schema);
    expect(mock.Schema).toBeCalledTimes(1);
});

it('should resolve shorthanded properties', () => {
    expect(mock.Schema).toBeCalledWith(mock.fixedSchema,  mock.parentSchema);
});
