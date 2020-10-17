const load = require('../src/load');

const paths = require('./fixtures/paths');

const DUMMY = 'teapots';

let component = undefined;

beforeEach(async () => {
    component = await load(paths.root(DUMMY));
});

it('should load manifest', () => {
    expect(component.manifest.domain).toEqual(DUMMY);
});

it('should load operations', () => {
    expect(component.operations[0].algorithm).toBeInstanceOf(Function);
    expect(component.operations[0].manifest).toBeInstanceOf(Object);
    expect(component.operations[0].manifest.schema).toBeInstanceOf(Object);
});
