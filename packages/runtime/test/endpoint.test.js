const Endpoint = require('../src/endpoint');

const locator = {};
const name = 'test';

let endpoint = undefined;

beforeEach(() => {
    endpoint = new Endpoint(locator, name);
});

it('should expose locator', () => {
    expect(endpoint.locator).toEqual(locator);
});

it('should expose name', () => {
    expect(endpoint.name).toEqual(name);
});
