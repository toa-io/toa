const path = require('path');

const response = { ok: 1 };
const runtime = {
    invoke: jest.fn(() => response),
    start: jest.fn(),
    stop: jest.fn(),
};

const mockCompose = jest.fn(() => runtime);

jest.mock('@kookaburra/boot', () => ({
    compose: mockCompose
}));

const invoke = require('../src/commands/invoke');

console.log = jest.fn();
console.error = jest.fn();

const args = {
    component: 'dummy.component',
    operation: 'add',
    input: '{ "a": 1, "b": 2 }',
    inputRelaxed: '{ a: 1, b: 2 }',
    inputObject: { a: 1, b: 2 },
    query: '{ "a": 3, "b": 4 }',
    queryRelaxed: '{ a: 3, b: 4 }',
    queryObject: { a: 3, b: 4 },
};

let result = undefined;

beforeEach(async () => {
    runtime.invoke.mockClear();
    mockCompose.mockClear();

    result = await invoke(args.component, args.operation, args.input, args.query);
});

it('should compose', () => {
    const dir = path.resolve(process.cwd(), args.component);

    expect(mockCompose).toBeCalledTimes(1);
    expect(mockCompose).toBeCalledWith(dir);
});

it('should invoke', () => {
    expect(runtime.invoke).toBeCalledTimes(1);
    expect(runtime.invoke).toBeCalledWith(args.operation, args.inputObject, args.queryObject);
});

it('should invoke with relaxed json', async () => {
    runtime.invoke.mockClear();
    await invoke(args.component, args.operation, args.inputRelaxed, args.queryRelaxed);

    expect(runtime.invoke).toBeCalledWith(args.operation, args.inputObject, args.queryObject);
});
