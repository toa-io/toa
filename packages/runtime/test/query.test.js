const clone = require('clone');
const mock = require('./fixtures/query');

jest.mock('../src/query/criteria', () => mock.criteria);

const query = require('../src/query');

let result;

beforeEach(() => {
    result = query(mock.query, mock.properties, mock.options);
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

it('should shrink omit value', () => {
    const q = clone(mock.query);
    q.omit = 1000000;

    result = query(q, mock.properties, mock.options);

    expect(result.omit).toEqual(mock.options.max.omit);
});

it('should parse limit', () => {
    expect(result.limit).toEqual(mock.limit);
});

it('should shrink limit value', () => {
    const q = clone(mock.query);
    q.limit = 1000000;

    result = query(q, mock.properties, mock.options);

    expect(result.limit).toEqual(mock.options.max.limit);
});

it('should parse query projection', () => {
    expect(result.projection).toEqual(mock.query.projection);
});

it('should parse state projection if no query projection', () => {
    const q = clone(mock.query);
    delete q.projection;

    result = query(q, mock.properties, mock.options);

    expect(result.projection).toEqual(mock.options.projection);
});

it('should throw if schema missing projection property', () => {
    const broken = clone(mock.query);

    broken.projection.push('foo');

    expect(() => query(broken, mock.properties, mock.options)).toThrow(/Schema missing projection property/);
});
