const query = require('../src/query');

it('should use defaults for limit', () => {
    expect(query({ limit: { default: 10 } }, { limit: { max: 100 } }))
        .toEqual(expect.objectContaining({ limit: { default: 10, max: 100 } }));

    expect(query({ limit: { max: 100 } }, { limit: { default: 10 } }))
        .toEqual(expect.objectContaining({ limit: { default: 10, max: 100 } }));

    expect(query({}, { limit: { max: 100, default: 10 } }))
        .toEqual(expect.objectContaining({ limit: { default: 10, max: 100 } }));
});

it('should use defaults for omit', () => {
    expect(query({}, { omit: { max: 100 } }))
        .toEqual(expect.objectContaining({ omit: { max: 100 } }));
});

it('should use defaults for sort', () => {
    expect(query({}, { sort: 'name:desc' }))
        .toEqual(expect.objectContaining({ sort: 'name:desc' }));
});

it('should use defaults for sealed', () => {
    expect(query({}, { sealed: 1 }))
        .toEqual(expect.objectContaining({ sealed: 1 }));
});

it('should use defaults for frozen', () => {
    expect(query({}, { frozen: 1 }))
        .toEqual(expect.objectContaining({ frozen: 1 }));
});

it('should use defaults for criteria', () => {
    expect(query({}, { criteria: 'name==test' }))
        .toEqual(expect.objectContaining({ criteria: 'name==test' }));
});

it('should merge continuation criteria with default', () => {
    expect(query({ criteria: ';age=32' }, { criteria: 'name==foo' }))
        .toEqual(expect.objectContaining({ criteria: 'name==foo;age=32' }));
    expect(query({ criteria: ',name==bar' }, { criteria: 'name==foo' }))
        .toEqual(expect.objectContaining({ criteria: 'name==foo,name==bar' }));
});

it('should use defaults for projection', () => {
    expect(query({}, { projection: ['a', 'b'] }))
        .toEqual(expect.objectContaining({ projection: ['a', 'b'] }));
});
