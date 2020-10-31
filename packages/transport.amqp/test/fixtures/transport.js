const string = () => Math.random().toString(36).substring(2);

const broker = {
    on: jest.fn(),
};

const rascal = {
    BrokerAsPromised: {
        create: jest.fn(() => broker),
    },
    withDefaultConfig: jest.fn((config) => { config.default = string() }),
};

const config = jest.fn(() => ({ prop: string() }))

module.exports = { rascal, broker, config };
