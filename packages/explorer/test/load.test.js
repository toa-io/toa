const load = require('../src/load');

const paths = require('./fixtures/paths');

const DUMMY = 'math.calculator';

let component = undefined;

beforeEach(async () => {
    component = await load(paths.root(DUMMY));
});

it('should load manifest', () => {
    const [ domain, name ] = DUMMY.split('.');

    expect(component.manifest.component.domain).toEqual(domain);
    expect(component.manifest.component.name).toEqual(name);
});

it('should load operations', () => {
    expect(component.operations[0].algorithm).toBeInstanceOf(Function);
    expect(component.operations[0].manifest).toBeInstanceOf(Object);
    expect(component.operations[0].manifest.schema).toBeInstanceOf(Object);
});
