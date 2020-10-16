const path = require('path');
const config = require('../../src/config');

const ROOT = path.resolve(path.dirname(require.resolve('@kookaburra/dummies')));

const root = (dummy) => {
    return path.resolve(ROOT, dummy);
};

const manifest = (dummy) => {
    return path.resolve(ROOT, dummy, config.paths.manifest);
};

const join = (dummy, ref) => {
    return path.resolve(ROOT, dummy, 'src', ref);
};

module.exports = { root, manifest, join };
