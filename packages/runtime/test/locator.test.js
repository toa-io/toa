const clone = require('clone');

const Locator = require('../src/locator');

const manifest = {
    domain: 'test_domain',
    name: 'test_name',
};
let locator = undefined;

beforeEach(() => {
    locator = new Locator(manifest);
});

it('should expose domain', () => {
    expect(locator.domain).toEqual(manifest.domain);
});

it('should expose name', () => {
    expect(locator.name).toEqual(manifest.name);
});

it('should expose state name if no component name', () => {
    const man = clone(manifest);
    delete man.name;
    man.state = { name: 'state_name' };

    locator = new Locator(man);
    expect(locator.name).toEqual(man.state.name);
});

it('should throw if no name provided', () => {
    const man = clone(manifest);
    delete man.name;

    expect(() => new Locator(man)).toThrow(/component name or state name/);
});

it('should provide host', () => {
    expect(locator.host('sql')).toEqual(`${manifest.domain}.sql.facility`);
});
