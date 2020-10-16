const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const locate = require('./locate');

const config = require('./config');

const load = (current) => {
    const root = locate(current);

    const manifest = loadManifest(root);
    const operations = loadOperations(root);

    return { manifest, operations };
};

const loadManifest = (root) => {
    const manifestYaml = path.resolve(root, config.paths.manifest);

    return yaml.safeLoad(fs.readFileSync(manifestYaml));
};

const loadOperations = (root) => {
    const operationsRoot = path.resolve(root, config.paths.operations);

    return dirs(operationsRoot).map(loadOperation(operationsRoot));
};

const loadOperation = (root) => (name) => {
    const operationRoot = path.resolve(root, name);
    const algorithm = require(path.resolve(operationRoot, config.paths.algorithm));
    const manifestYaml = path.resolve(operationRoot, config.paths.descriptor);
    const manifest = yaml.safeLoad(fs.readFileSync(manifestYaml));

    return { name, algorithm, manifest };
};

const dirs = (root) => {
    // noinspection JSValidateTypes
    return fs
        .readdirSync(root, { withFileTypes: true })
        .filter(ent => ent.isDirectory())
        .map(ent => ent.name);
};

module.exports = load;
