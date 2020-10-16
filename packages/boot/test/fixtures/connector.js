const string = () => Math.random().toString(36).substring(2);

const locator = {
    host: jest.fn(() => string()),
    domain: string(),
};

const schema = string();

const state = {
    connector: 'mongodb',
    name: string(),
};

module.exports = { locator, state, schema };
