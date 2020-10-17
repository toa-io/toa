const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const locate = require('./locate');

const config = require('./config');

const load = (current) => {
    const root = locate(current);

    const manifest = loadManifest(root);
    const operations = loadOperations(root, manifest.operations);

    return { manifest, operations };
};

const loadManifest = (root) => {
    const manifestYaml = path.resolve(root, config.paths.manifest);

    return yaml.safeLoad(fs.readFileSync(manifestYaml));
};

const loadOperations = (root, manifest) => {
    const operationsRoot = path.resolve(root, config.paths.operations);

    return loadAlgorithms(operationsRoot).map(({ name, algorithm }) => ({ name, algorithm, manifest: manifest[name] }));
};

const loadAlgorithms = (root) => {
    // noinspection JSValidateTypes
    return fs
        .readdirSync(root, { withFileTypes: true })
        .filter(ent => ent.isFile())
        .map(ent => {
            const algorithm = require(path.resolve(root, ent.name))
            const name = path.basename(ent.name, '.js');

            return { name, algorithm };
        });
};


module.exports = load;
