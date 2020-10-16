const Operation = require('../src/operation');
const mock = require('./fixtures/operation');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('algorithm parse', () => {

    it('should not throw on function expression', () => {
        expect(() => new Operation(mock.endpoint, ({ input }) => input)).not.toThrow();
    });

    it('should not throw on function declaration', () => {
        function algorithm({ input }) {
        }

        expect(() => new Operation(mock.endpoint, algorithm)).not.toThrow();
    });

    it('should throw if algorithm is not function', () => {
        expect(() => new Operation(mock.endpoint, 1)).toThrow('must be a function');
        expect(() => new Operation(mock.endpoint, {})).toThrow();
    });

    describe('first argument', () => {

        it('should throw if not a deconstruction', () => {
            expect(() => new Operation(mock.endpoint, (a) => a))
                .toThrow('must be a deconstruction');
        });

        it('should throw if contains not allowed properties', () => {
            expect(() => new Operation(mock.endpoint, ({ input, excess }) => ({ input, excess })))
                .toThrow('must be a deconstruction');
        });

    });

    describe('second argument', () => {

        it('should not throw if argument name is allowed', () => {
            expect(() => new Operation(mock.endpoint, ({ input }, object) => ({ input, object })))
                .not.toThrow();
            expect(() => new Operation(mock.endpoint, ({ input }, collection) => ({ input, collection })))
                .not.toThrow();
            expect(() => new Operation(mock.endpoint, ({ input }, cursor) => ({ input, cursor })))
                .not.toThrow();
        });

        it('should throw if argument name is not allowed ', () => {
            const algorithm = ({ input }, excess) => ({ input, excess });
            expect(() => new Operation(mock.endpoint, algorithm)).toThrow('must be one of');
        });

    });

});

describe('invoke', () => {

    describe('state', () => {

        // noinspection DuplicatedCode
        it('should pass object if argument is object', async () => {
            const mockFn = jest.fn(() => 1);
            const algorithm = ({ input, output }, object) => mockFn({ input, output }, object);

            const operation = new Operation(mock.endpoint, algorithm, mock.state);

            await operation.invoke(mock.io(), mock.query);

            expect(mock.state.object).toBeCalledTimes(1);
            expect(mock.state.object).toBeCalledWith(mock.query);

            expect(mockFn).toBeCalledTimes(1);
            expect(mockFn.mock.calls[0][1]).toEqual(mock.state.object.mock.results[0].value);
        });


        // noinspection DuplicatedCode
        it('should pass collection if argument is object', async () => {
            const mockFn = jest.fn(() => 1);
            const algorithm = ({ input, output }, collection) => mockFn({ input, output }, collection);

            const operation = new Operation(mock.endpoint, algorithm, mock.state);

            await operation.invoke(mock.io(), mock.query);

            expect(mock.state.collection).toBeCalledTimes(1);
            expect(mock.state.collection).toBeCalledWith(mock.query);

            expect(mockFn).toBeCalledTimes(1);
            expect(mockFn.mock.calls[0][1]).toEqual(mock.state.collection.mock.results[0].value);
        });

        // noinspection DuplicatedCode
        it('should not create neither object nor collection if no argument', async () => {
            const algorithm = ({ }) => {};

            const operation = new Operation(mock.endpoint, algorithm);

            await operation.invoke(mock.io(), mock.query, mock.state);

            expect(mock.state.object).toBeCalledTimes(0);
            expect(mock.state.collection).toBeCalledTimes(0);
        });

        it('should commit objects', async () => {
            const operation = new Operation(mock.endpoint, mock.algorithm, mock.state);

            await operation.invoke(mock.io(), mock.query);

            expect(mock.state.object.mock.results[0].value._commit).toBeCalledTimes(1);
        });

        it('should write error if no object found', async () => {
            const operation = new Operation(mock.endpoint, mock.algorithm, mock.state);
            const io = mock.io();

            await operation.invoke(io, { notFound: true });

            expect(io.error.status).toEqual(4);
        });

        it('should write error if state persistence error', async () => {
            const operation = new Operation(mock.endpoint, mock.algorithm, mock.state);
            const io = mock.io();

            await operation.invoke(io, { persistenceError: true });

            expect(io.error.status).toEqual(0);
        });

    });

});
