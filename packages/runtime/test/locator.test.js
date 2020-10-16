const Locator = require('../src/locator');

const domain = 'test_domain';
const name = 'test_name';
let locator = undefined;

beforeEach(() => {
    locator = new Locator(domain, name);
});

it('should expose domain', () => {
    expect(locator.domain).toEqual(domain);
});

it('should expose name', () => {
    expect(locator.name).toEqual(name);
});

it('should provide host', () => {
    expect(locator.host('sql')).toEqual(`${domain}.sql.facility`);
});
