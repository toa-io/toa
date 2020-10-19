const path = require('../src/path');

it('should return path', () => {
    const input = '/static';
    const result = path(input);
    expect(result.path).toEqual(input);
});

it('should parse parameters', () => {
    const input = '/{_id}';
    const result = path(input);
    expect(result.path).toEqual('/:_id');
});

it('should parse constants', () => {
    const input = '/{big:size>2}-and-{popular:popularity=true}';
    const result = path(input);
    expect(result.path).toEqual('/big-and-popular');
    expect(result.expressions).toEqual(['size>2', 'popularity=true']);
});
