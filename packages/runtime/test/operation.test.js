const Operation = require('../src/operation');
const mock = require('./fixtures/operation');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('algorithm parse', () => {

    it('should throw on function expression', () => {
        expect(() => new Operation(mock.meta, mock.endpoint, ({ input }) => input)).toThrow();
    });

    it('should throw on wrong function name', () => {
        function algorithm({ input }) {}

        expect(() => new Operation(mock.meta, mock.endpoint, algorithm)).toThrow();
    });

    it('should throw if algorithm is not function', () => {
        expect(() => new Operation(mock.meta, mock.endpoint, 1)).toThrow('must be a named function');
        expect(() => new Operation(mock.meta, mock.endpoint, {})).toThrow();
    });

    describe('first argument', () => {

        it('should throw if not a deconstruction', () => {
            function transition(a) {}
            expect(() => new Operation(mock.meta, mock.endpoint, transition))
                .toThrow('must be a deconstruction');
        });

        it('should throw if contains not allowed properties', () => {
            function transition({ input, excess }) {}
            expect(() => new Operation(mock.meta, mock.endpoint, transition))
                .toThrow('must be a deconstruction');
        });

    });

    describe('second argument', () => {

        it('should throw if argument name is not allowed', () => {
            function transition({}, database) {}
            expect(() => new Operation(mock.meta, mock.endpoint, transition)).toThrow(/Second argument/);
        });

    });

});

describe('invoke', () => {

    describe('state', () => {

        // noinspection DuplicatedCode
        it('should pass object if argument is object', async () => {
            const mockFn = jest.fn(() => 1);

            function observation({ input, output }, object) {
                mockFn({ input, output }, object);
            }

            const operation = new Operation(mock.meta, mock.endpoint, observation, mock.state, mock.options);

            await operation.invoke(mock.io(), mock.query);

            expect(mock.state.object).toBeCalledTimes(1);
            expect(mock.state.object).toBeCalledWith(mock.query);

            expect(mockFn).toBeCalledTimes(1);
            expect(mockFn.mock.calls[0][1]).toEqual(mock.state.object.mock.results[0].value);
        });

        it('should pass readonly object to observation', async () => {
            expect.assertions(1);

            function observation({ input, output }, object) {
                object.foo = 'bar';
                expect(object.foo).not.toBeDefined();
            }

            const operation = new Operation(mock.meta, mock.endpoint, observation, mock.state, mock.options);
            await operation.invoke(mock.io(), mock.query);
        });


        // noinspection DuplicatedCode
        it('should pass collection if argument is object', async () => {
            const mockFn = jest.fn(() => 1);

            function observation({ input, output }, collection) {
                mockFn({ input, output }, collection);
            }

            const operation = new Operation(mock.meta, mock.endpoint, observation, mock.state);

            await operation.invoke(mock.io(), mock.query);

            expect(mock.state.collection).toBeCalledTimes(1);
            expect(mock.state.collection).toBeCalledWith(mock.query);

            expect(mockFn).toBeCalledTimes(1);
            expect(mockFn.mock.calls[0][1]).toEqual(mock.state.collection.mock.results[0].value);
        });

        // noinspection DuplicatedCode
        it('should not create neither object nor collection if no argument', async () => {
            function transition({}) {}

            const operation = new Operation(mock.meta, mock.endpoint, transition);

            await operation.invoke(mock.io(), mock.query, mock.state);

            expect(mock.state.object).toBeCalledTimes(0);
            expect(mock.state.collection).toBeCalledTimes(0);
        });

        it('should commit objects', async () => {
            const operation = new Operation(mock.meta, mock.endpoint, mock.algorithm, mock.state);

            await operation.invoke(mock.io(), mock.query);

            expect(mock.state.object.mock.results[0].value._commit).toBeCalledTimes(1);
        });

        it('should write error if no object found', async () => {
            const operation = new Operation(mock.meta, mock.endpoint, mock.algorithm, mock.state);
            const io = mock.io();

            await operation.invoke(io, { notFound: true });

            expect(io.error.status).toEqual(4);
        });

        it('should write error if state persistence error', async () => {
            const operation = new Operation(mock.meta, mock.endpoint, mock.algorithm, mock.state);
            const io = mock.io();

            await operation.invoke(io, { persistenceError: true });

            expect(io.error.status).toEqual(0);
        });

    });

});
