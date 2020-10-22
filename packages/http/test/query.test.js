const string = () => Math.random().toString(36).substring(2);

const query = require('../src/query');

describe('common', () => {
    const params = {
        a: string(),
        b: string(),
    };

    it('should map params to query criteria', () => {
        const result = query({}, {}, { query: {}, params });
        expect(result.criteria).toEqual(`a==${params.a};b==${params.b}`);
    });

    it('should resolve pointers', () => {
        const result = query(
            {},
            { query: { criteria: 'a==*test' } },
            { query: {}, params: { __test: 1 } },
        );

        expect(result.criteria).toEqual('a==1');
    });


    it('should map request criteria to query criteria', () => {
        const criteria = string();
        const result = query({}, {}, { query: { criteria }, params: {} });

        expect(result.criteria).toEqual(criteria);
    });

    it('should merge params and request criteria', () => {
        const criteria = string();
        const result = query({}, {}, { query: { criteria }, params });

        expect(result.criteria).toEqual(`${criteria};a==${params.a};b==${params.b}`);
    });

    it('should map binding criteria to query criteria', () => {
        const criteria = string();
        const result = query({}, { query: { criteria } }, { query: {}, params: {} });

        expect(result.criteria).toEqual(criteria);
    });

    it('should merge binding, request and params criteria', () => {
        const bc = string();
        const rc = string();

        const result = query({}, { query: { criteria: bc } }, { query: { criteria: rc }, params });
        expect(result.criteria).toEqual(`${bc};${rc};a==${params.a};b==${params.b}`);
    });

    it('should ignore request criteria sealed by binding', () => {
        const bc = string();
        const rc = string();

        const result = query({}, { query: { criteria: bc, sealed: 1 } }, { query: { criteria: rc }, params });
        expect(result.criteria).toEqual(`${bc};a==${params.a};b==${params.b}`);
    });

    it('should ignore request criteria if binding is frozen', () => {
        const rc = string();

        const result = query({}, { query: { frozen: 1 } }, { query: { criteria: rc }, params });
        expect(result.criteria).toEqual(`a==${params.a};b==${params.b}`);
    });

});

describe('collection state', () => {
    const operation = { state: 'collection' };

    const args = ['omit', 'limit', 'sort'];

    args.forEach((argument, index) => {
        const value = string();

        describe(argument, () => {

            it(`should map request argument to query`, () => {
                const result = query(operation.state, {}, { query: { [argument]: value }, params: {} });

                expect(result[argument]).toEqual(value);
            });

            it(`should map binding argument to query`, () => {
                const result = query(operation.state, { query: { [argument]: value } }, { query: {}, params: {} });

                expect(result[argument]).toEqual(value);
            });

            it(`should merge binding and request arguments`, () => {
                const ra = args[(index + 1) % args.length];
                const rv = string();

                const result = query(
                    operation.state,
                    { query: { [argument]: value } },
                    { query: { [ra]: rv }, params: {} },
                );

                expect(result[argument]).toEqual(value);
                expect(result[ra]).toEqual(rv);
            });

            it(`should override binding values by request values`, () => {
                const rv = string();
                const result = query(operation.state, { query: { [argument]: value } }, {
                    query: { [argument]: rv },
                    params: {},
                });

                expect(result[argument]).toEqual(rv);
            });

            it(`should ignore request values sealed by binding`, () => {
                const rv = string();
                const result = query(
                    operation.state,
                    { query: { [argument]: value, sealed: 1 } },
                    { query: { [argument]: rv }, params: {} },
                );

                expect(result[argument]).toEqual(value);
            });

            it(`should ignore all request values if binding is frozen`, () => {
                const ra = args[(index + 1) % args.length];
                const rv = string();

                const result = query(
                    operation.state,
                    { query: { [argument]: value, frozen: 1 } },
                    { query: { [argument]: rv, [ra]: rv }, params: {} },
                );

                expect(result[argument]).toEqual(value);
                expect(result[ra]).not.toBeDefined();
            });

        });

    });

});
