const clone = require('clone');
const mock = require('./fixtures/query');

jest.mock('../src/query/criteria', () => mock.criteria);

const query = require('../src/query');

let result;

beforeEach(() => {
    result = query(mock.query, mock.properties);
});

it('should parse criteria', () => {
    expect(result.criteria).toBeDefined();
    expect(result.criteria).toEqual(mock.criteria.mock.results[0].value);
});

it('should parse sort', () => {
    expect(result.sort).toEqual(mock.sort);
});

it('should parse omit', () => {
    expect(result.omit).toEqual(mock.omit);
});

it('should parse select', () => {
    expect(result.select).toEqual(mock.select);
});

it('should parse projection', () => {
    expect(result.projection).toEqual(mock.projection);
});

it('should throw if schema missing projection property', () => {
    const broken = clone(mock.query);

    broken.projection.push('foo');

    expect(() => query(broken, mock.properties)).toThrow(/Schema missing projection property/);
});
