const path = require('path');
const find = require('find-up');

const config = require('./config');

const locate = (current) => {
    const manifest = find.sync(config.paths.manifest, { cwd: current });

    if (!manifest)
        throw new Error(`No manifest file at ${current}`);

    return path.dirname(manifest);
};

module.exports = locate;
