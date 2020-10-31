const mock = require('./fixtures/transport');

jest.mock('rascal', () => mock.rascal);
jest.mock('../src/config', () => mock.config);

const Transport = require('../src/transport');

const string = () => Math.random().toString(36).substring(2);
console.log = jest.fn();

let transport = undefined,
    host = undefined,
    label = undefined;

beforeEach(() => {
    jest.clearAllMocks();

    host = string();
    label = string();

    transport = new Transport(host, label);
});

describe('connect', () => {

    beforeEach(async () => {
        await transport.connect();
    });

    it('should create broker', () => {
        expect(mock.rascal.withDefaultConfig).toBeCalledTimes(1);
        expect(mock.rascal.withDefaultConfig)
            .toBeCalledWith(mock.config.mock.results[0].value);

        expect(mock.rascal.BrokerAsPromised.create).toBeCalledTimes(1);
        expect(mock.rascal.BrokerAsPromised.create)
            .toBeCalledWith(mock.rascal.withDefaultConfig.mock.results[0].value);
    });

    it('should connect once', async () => {
        await transport.connect();
        expect(mock.rascal.BrokerAsPromised.create).toBeCalledTimes(1);
    })

    it('should handle broker error', () => {
        expect(mock.broker.on).toBeCalledWith('error', expect.any(Function));
    });

    it('should log masked password', () => {
        expect(console.log.mock.calls[0][0])
            .toMatch(/amqp:\/\/guest:\*+@/);
    });

    it('should default connection url with host', async () => {
        const url = mock.config.mock.calls[0][0];
        expect(url).toEqual(`amqp://guest:guest@${host}:5672/`);
    });

    describe('env', () => {

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should use env variables for user, secret, host and port', async () => {
            process.env.KOO_TRANSPORT_AMQP_HOST = host;
            const port = process.env.KOO_TRANSPORT_AMQP_PORT = Math.round(Math.random() * 100 + 5700);
            const user = process.env.KOO_TRANSPORT_AMQP_USER = string();
            const secret = process.env.KOO_TRANSPORT_AMQP_SECRET = string();

            transport = new Transport(host, label);
            await transport.connect();

            const url = mock.config.mock.calls[0][0];
            expect(url).toEqual(`amqp://${user}:${secret}@${host}:${port}/`);
        });

    });

});

