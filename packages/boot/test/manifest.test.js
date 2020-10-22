const mockQuery = jest.fn(() => Math.random());
jest.mock('../src/query', () => mockQuery);

const manifest = require('../src/manifest');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('state', () => {

    it('should add name as component name', () => {
        const input = { domain: 'test_domain', name: 'test_name', state: {} };
        manifest(input);
        expect(input.state.name).toEqual(input.name);
    });

    it('should add name as component domain', () => {
        const input = { domain: 'test_domain', state: {} };
        manifest(input);
        expect(input.state.name).toEqual(input.domain);
    });

    it('should set default max values', () => {
        const input = { state: {} };
        manifest(input);
        expect(input.state.max.limit).toEqual(100);
        expect(input.state.max.omit).toEqual(1000);
    });

});

describe('remotes', () => {

    it('should treat string as one element array', () => {
        const input = { remotes: 'test_remote' };
        manifest(input);
        expect(input.remotes).toEqual(['test_remote']);
    });

});

describe('operations', () => {

    const template = {
        package: '@kookaburra/templates',
        name: 'get',
    };

    it('should treat string as template', () => {
        const input = { operations: { get: 'get' } };
        manifest(input);
        expect(input.operations.get).toEqual({ template });
    });

    it('should treat null as template with same name', () => {
        const input = { operations: { get: null } };
        manifest(input);
        expect(input.operations.get).toEqual({ template });
    });

    describe('template', () => {

        it('should treat string as default template operation name', () => {
            const input = { operations: { get: { template: 'get' } } };
            manifest(input);
            expect(input.operations.get).toEqual({ template });
        });

        it('should treat null as default template with same name', () => {
            const input = { operations: { get: { template: null } } };
            manifest(input);
            expect(input.operations.get).toEqual({ template });
        });

        it('should treat omitted name as template name', () => {
            const input = { operations: { get: { template: { package: '@kookaburra/templates' } } } };
            manifest(input);
            expect(input.operations.get).toEqual({ template });
        });

    });

    describe('http', () => {

        it('should treat string as one binding path', () => {
            const input = { operations: { get: { http: '/' } } };
            manifest(input);
            expect(input.operations.get.http).toEqual([{ path: '/' }]);
        });

        it('should treat strings as paths', () => {
            const input = { operations: { get: { http: ['/', '/path'] } } };
            manifest(input);
            expect(input.operations.get.http).toEqual([
                { path: '/' },
                { path: '/path' },
            ]);
        });

        it('should build query', () => {
            const input = {
                operations: {
                    get: {
                        query: { select: 1 },
                        http: [{ path: '/', query: { select: 2 } }],
                    },
                },
            };
            manifest(input);
            expect(mockQuery).toBeCalledWith({ select: 2 }, mockQuery.mock.results[0].value);
        });

        it('should inherit representation', () => {
            const input = {
                operations: {
                    get: {
                        query: { select: 1 },
                        representation: ['a'],
                        http: [{ path: '/', query: { select: 2 } }],
                    },
                },
            };

            manifest(input);
            expect(input.operations.get.http[0].representation).toEqual(['a']);
        });

    });

});
