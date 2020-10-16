const mock = require('./fixtures/query');

jest.mock('../src/query/criteria', () => mock.criteria);

const query = require('../src/query');

let result;

beforeEach(() => {
    result = query(mock.query);
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
