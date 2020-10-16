const locate = require('../src/locate');
const paths = require('./fixtures/paths');

const DUMMY = 'math.calculator';
const ROOT = paths.root(DUMMY);

it('should locate root from root', () => {
    expect(locate(ROOT)).toEqual(ROOT);
});

it('should locate root from subdirectory',  () => {
    const path1 = paths.join(DUMMY, './operations');
    const path2 = paths.join(DUMMY, './operations/div');

    expect(locate(path1)).toEqual(ROOT);
    expect(locate(path2)).toEqual(ROOT);
});

it('should throw if manifest not found', () => {
    const path = paths.join(DUMMY,'../..');

    expect(() => locate(path)).toThrow('Manifest file not found');
});
