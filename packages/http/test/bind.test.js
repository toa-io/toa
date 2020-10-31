const mock = require('./fixtures/bind');

jest.mock('../src/query', () => mock.query);

const bind = require('../src/bind');

beforeEach(() => {
    jest.clearAllMocks();

    delete process.env.NODE_ENV;

    bind(mock.app, mock.verb, mock.route, mock.operation, mock.binding);
});

it('should bind to path', () => {
    expect(mock.app.get).toBeCalledTimes(1);
    expect(mock.app.get.mock.calls[0][0]).toEqual(mock.route);
});

describe('request handling', () => {

    describe('success', () => {
        let request = undefined;

        beforeEach(async () => {
            request = mock.app.get.mock.calls[0][1];
            request = mock.app.get.mock.calls[0][1];

            await request(mock.req, mock.res);
        });

        it('should create query', () => {
            expect(mock.query).toBeCalledWith(mock.operation.state, mock.binding, mock.req);
        });

        it('should invoke operation', () => {
            const input = mock.req.body;
            const query = mock.query.mock.results[0].value;

            expect(mock.operation.invoke).toBeCalledWith(input, query);
        });

        it('should send success json response', () => {
            expect(mock.res.status).toBeCalledWith(200);
            expect(mock.res.json).toBeCalledWith(mock.operation.invoke.mock.results[0].value.output);
        });

        it('should send success empty response', async () => {
            jest.clearAllMocks();
            await request({ body: { empty: 1 } }, mock.res);

            expect(mock.res.status).toBeCalledWith(200);
            expect(mock.res.json).toBeCalledTimes(0);
            expect(mock.res.end).toBeCalledTimes(1);
        });

    });

    describe('error', () => {

        beforeEach(async () => {
            const request = mock.app.get.mock.calls[0][1];

            await request({ body: { error: 1 } }, mock.res);
        });

        it('should send error response', () => {
            expect(mock.res.status).toBeCalledWith(400 + mock.statuses.error);
            expect(mock.res.json).toBeCalledWith(mock.operation.invoke.mock.results[0].value.error);
            expect(mock.res.json.mock.calls[0][0].status).not.toBeDefined();
        });

    });

    describe(('exception'), () => {
        let request = undefined;

        beforeEach(() => {
            request = mock.app.get.mock.calls[0][1];
        });

        it('should send internal error', async () => {
            await request({ body: { exception: 1 } }, mock.res);

            expect(mock.res.status).toBeCalledWith(500);
            expect(mock.res.json).toBeCalledTimes(0);
            expect(mock.res.end).toBeCalledTimes(1);
        });

        it('should send exception details if env=local', async () => {
            const _ = process.NODE_ENV;
            process.env.NODE_ENV = 'local';
            await request({ body: { exception: 1 } }, mock.res);
            process.env.NODE_ENV = _;

            expect(mock.res.status).toBeCalledWith(500);
            expect(mock.res.json).toBeCalledTimes(1);
            expect(mock.res.json.mock.calls[0][0]).toEqual({
                message: mock.exception.message,
                stack: mock.exception.stack,
            });

            expect(mock.exception.message).toBeDefined();
            expect(mock.exception.stack).toBeDefined();
        });

    });

});
