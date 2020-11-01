const Runtime = require('../src/runtime');
const mock = require('./fixtures/runtime');

console.log = jest.fn();

let runtime = undefined;

beforeEach(() => {
    jest.clearAllMocks();

    runtime = new Runtime(mock.locator, mock.transport, mock.operations, mock.subs, mock.connectors);
});

describe('transport', () => {

    it('should declare operations', () => {
        expect(mock.transport.hosts).toBeCalledTimes(mock.operations.length);

        mock.operations.forEach((operation, index) => {
            expect(mock.transport.hosts)
                .toHaveBeenNthCalledWith(index + 1, operation.endpoint.label, expect.any(Function));
        });

    });

});

describe('invoke', () => {
    let operation = undefined;
    let io = undefined;

    beforeEach(async () => {
        operation = mock.operations[1];
        io = await runtime.invoke(operation.endpoint.name, mock.input, mock.query);
    });

    it('should invoke by name', () => {
        expect(operation.invoke).toBeCalledTimes(1);
        expect(mock.operations[0].invoke).toBeCalledTimes(0);
        expect(mock.operations[2].invoke).toBeCalledTimes(0);

        expect(operation.invoke).toBeCalledWith(
            expect.objectContaining({
                input: expect.any(Object),
                output: expect.any(Object),
                error: expect.any(Object),
            }),
            mock.query,
        );
    });

    it('should return output', () => {
        expect(io.output).toEqual(mock.output);
        expect(Object.keys(io)).toEqual(['output']);
    });

    it('should return error', async () => {
        const input = { error: 1 };
        io = await runtime.invoke(operation.endpoint.name, input, mock.query);
        expect(io.error).toEqual(mock.error);
    });

    it('should throw if operation not found', () => {
        expect(() => runtime.invoke('foo', mock.input, mock.query)).rejects.toThrow(/not found/);
    });

});

describe('start', () => {

    beforeEach(async () => {
        await runtime.start();
    });

    it('should connect transport', () => {
        expect(mock.transport.connect).toBeCalledTimes(1);
    });

    it('should connect connectors', async () => {
        mock.connectors.forEach(
            (connector) => expect(connector.connect).toBeCalledTimes(1));
    });

    it('should log', () => {
        expect(console.log).toBeCalledTimes(1);
        expect(console.log).toBeCalledWith(expect.stringMatching(/started/));
    });

});

describe('stop', () => {

    beforeEach(async () => {
        await runtime.start();
        await runtime.stop();
    });

    it('should disconnect transport', () => {
        expect(mock.transport.disconnect).toBeCalledTimes(1);
    });

    it('should disconnect connectors', async () => {
        mock.connectors.forEach(
            (connector) => expect(connector.disconnect).toBeCalledTimes(1));
    });

    it('should log', () => {
        expect(console.log).toBeCalledTimes(2);
        expect(console.log.mock.calls[1][0]).toMatch(/stopped/);
    });

});


