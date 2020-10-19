const Invocation = require('../src/invocation');
const mock = require('./fixtures/invocation');

let invocation = undefined;

beforeEach(() => {
    jest.clearAllMocks();

    invocation = new Invocation(mock.operation, mock.schema);
});

it('should proxy public properties', () => {
    ['endpoint', 'type', 'access', 'http'].forEach((prop) => {
        expect(invocation[prop]).toBeDefined();
        expect(invocation[prop]).toEqual(mock.operation[prop]);
    });
});

it('should provide type', () => {
    expect(invocation.type).toBeDefined();
    expect(invocation.type).toEqual(mock.operation.type);
});

it('should provide access', () => {
    expect(invocation.endpoint).toBeDefined();
    expect(invocation.endpoint).toEqual(mock.operation.endpoint);
});

it('should invoke operation', () => {
    const io = mock.io();
    invocation.invoke(io, mock.query);

    expect(mock.operation.invoke).toBeCalledTimes(1);
    expect(mock.operation.invoke).toBeCalledWith(io, mock.query);
});

it('should validate input', async () => {
    const io = mock.io();

    await invocation.invoke(io);

    expect(mock.schema.fit).toBeCalledTimes(1);
});

it('should not validate undefined input', async () => {
    const io = mock.io();
    io.input = undefined;

    await invocation.invoke(io);

    expect(mock.schema.fit).toBeCalledTimes(0);
});

it('should write io.error if invalid input', () => {
    const io = mock.io();
    io.input.error = 1;

    invocation.invoke(io);

    expect(io.error.message).toEqual(mock.schema.error);
    expect(io.error.fields).toEqual(mock.schema.errors);
    expect(mock.operation.invoke).toBeCalledTimes(0);
});

it('should freeze input', () => {
    invocation.invoke(mock.io());

    const input = mock.operation.invoke.mock.calls[0][0].input;

    input.foo = 1;
    expect(input.foo).not.toBeDefined();
});

