const Invocation = require('../src/invocation');
const mock = require('./fixtures/invocation');

let invocation = undefined;

beforeEach(() => {
    jest.clearAllMocks();

    invocation = new Invocation(mock.operation, mock.schema);
});

it('should invoke operation', () => {
    const io = mock.io();
    invocation.invoke(io, mock.query);

    expect(mock.operation.invoke).toBeCalledTimes(1);
    expect(mock.operation.invoke).toBeCalledWith(io, mock.query);
});

it('should provide endpoint', () => {
    expect(invocation.endpoint).toBeDefined();
    expect(invocation.endpoint).toEqual(mock.operation.endpoint);
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

it('should not validate undefined input', async () => {
    const io = mock.io();
    io.input = undefined;

    await invocation.invoke(io);

    await expect(mock.schema.fit).toBeCalledTimes(0);
});

it('should not throw on empty input', async () => {
    const io = mock.io();
    io.input = '';

    await expect(invocation.invoke(io)).resolves.not.toThrow();
});
