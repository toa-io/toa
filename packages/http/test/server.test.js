const mock = require('./fixtures/server');

jest.mock('../src/bind', () => mock.bind);
jest.mock('../src/verb', () => mock.verb);
jest.mock('../src/path', () => mock.path);
jest.mock('express', () => mock.express);

const Server = require('../src/server');

let server = undefined, app = undefined;

beforeEach(() => {
    jest.clearAllMocks();
    server = new Server();
    app = mock.express.mock.results[0].value;
});

it('should bind', () => {
    server.bind(mock.operations);

    expect(mock.bind).toBeCalledTimes(4);

    let iteration = 0;

    mock.operations.forEach((operation) => {
        operation.bindings.forEach((binding) => {
            const verb = mock.verb.mock.results[iteration].value;
            const path = mock.path.mock.results[iteration].value;

            iteration++; // jest start Nth with 1

            expect(mock.path).toHaveBeenNthCalledWith(iteration, binding.path);
            expect(mock.verb).toHaveBeenNthCalledWith(iteration, operation, path.params);
            expect(mock.bind)
                .toHaveBeenNthCalledWith(iteration, app, verb, path.route, operation, binding);

        });
    });

});

it('should start server using default port', () => {
    server.start();

    expect(app.listen).toBeCalledTimes(1);
    expect(app.listen.mock.calls[0][0]).toEqual(8080);
});

it('should start server using env variable port', () => {
    const _ = process.env.KOO_HTTP_SERVER_PORT;

    process.env.KOO_HTTP_SERVER_PORT = 8081;

    server.start();

    expect(app.listen).toBeCalledTimes(1);
    expect(app.listen.mock.calls[0][0]).toEqual(process.env.KOO_HTTP_SERVER_PORT);

    process.env.KOO_HTTP_SERVER_PORT = _;
});

it('should close server', () => {
    server.start();
    server.stop();

    expect(mock.server.close).toBeCalledTimes(1);
});
