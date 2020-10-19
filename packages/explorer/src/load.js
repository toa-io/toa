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
    const contents = fs.readFileSync(manifestYaml);

    return yaml.safeLoad(contents);
};

const loadOperations = (root, manifest) => {
    const operationsRoot = path.resolve(root, config.paths.operations);

    return listAlgorithms(operationsRoot)
        .map(ent => loadAlgorithm(ent))
        .map(({ name, algorithm }) => ({ name, algorithm, manifest: manifest[name] }));
};

const listAlgorithms = (root) => {
    return fs
        .readdirSync(root, { withFileTypes: true })
        .filter(ent => ent.isFile())
        .map(ent => path.resolve(root, ent.name));
}

const loadAlgorithm = (location, type = 'javascript') => {
    const algorithm = require(`./algorithms/${type}`)(location);

    return algorithm;
};


module.exports = load;
