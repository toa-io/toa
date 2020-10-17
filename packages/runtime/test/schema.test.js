const Schema = require('../src/schema');
const mock = require('./fixtures/schema');
const clone = require('clone');

let schema;

beforeEach(() => {
    schema = new Schema(clone(mock.schema));
});

it('should return validation result', () => {
    const valid = Object.assign({}, mock.objects.valid);
    const invalid = Object.assign({}, mock.objects.invalid);

    expect(schema.fit(valid)).toBeTruthy();
    expect(schema.fit(invalid)).toBeFalsy();
});

it('should assign defaults to input', () => {
    const nob = Object.assign({}, mock.objects.nob);

    schema.fit(nob);
    expect(nob.b).toEqual(mock.bDefault);
});

it('should provide validation errors', () => {
    const invalid = Object.assign({}, mock.objects.invalid);

    const valid = schema.fit(invalid);
    expect(valid).toBeFalsy();

    expect(schema.errors).toBeInstanceOf(Array);
    expect(schema.errors.length).toEqual(1);

    expect(schema.errors[0].property).toBeDefined();
    expect(schema.errors[0].keyword).toBeDefined();
    expect(schema.errors[0].message).toBeDefined();

    expect(schema.error).toMatch(/a should be/);
});

it('should provide property if missing required', () => {
    const noa = Object.assign({}, mock.objects.noa);
    const valid = schema.fit(noa);

    expect(valid).toBeFalsy();
    expect(schema.errors[0].property).toEqual('a');
});

it('should provide properties', () => {
    expect(schema.properties).toEqual(mock.schema.properties);
});

it('should validate undefined input', () => {
    const valid = schema.fit();

    expect(valid).toBeFalsy();
    expect(schema.errors[0].property).toEqual('a');
    expect(schema.errors[0].keyword).toEqual('required');
});

it('should throw if argument not an object', () => {
    expect(() => schema.fit(1)).toThrow();
});

it('should list allowed values for enum errors', () => {
    const wrongC = Object.assign({}, mock.objects.wrongC);
    const valid = schema.fit(wrongC);

    expect(valid).toBeFalsy();
    expect(schema.error).toMatch(/one,two,three/);
});

it('should forbid additional properties', () => {
    const valid = Object.assign({}, mock.objects.valid);
    valid.excess = 'foo';

    expect(schema.fit(valid)).toBeFalsy();
    expect(schema.error).toMatch(/\bexcess\b/);
});

it('should resolve references', () => {
    const child = {
        properties: {
            a: {
                $ref: './#/properties/c',
            },
        },
    };

    schema = new Schema(child, clone(mock.schema));

    const result = schema.fit({ a: 'two' });

    expect(result).toBeTruthy();
});
