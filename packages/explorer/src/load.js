const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const locate = require('./locate');

const config = require('./config');

const load = (current, remote) => {
    const root = locate(current);

    const manifest = loadManifest(root);
    const operations = loadOperations(root, manifest.operations, remote);

    const pubs = remote ? undefined : loadPubs(root);
    const subs = remote ? undefined : loadSubs(root);

    return { manifest, operations, pubs, subs };
};

const loadManifest = (root) => {
    const manifestYaml = path.resolve(root, config.paths.manifest);
    const contents = fs.readFileSync(manifestYaml);

    return yaml.safeLoad(contents);
};

const loadOperations = (root, manifest, remote) => {
    const operationsRoot = path.resolve(root, config.paths.operations);

    return listAlgorithms(operationsRoot)
        .map(location => loadAlgorithm(location, remote))
        .map(({ name, algorithm }) => ({ name, algorithm, manifest: manifest[name] }));
};

const listAlgorithms = (root) => {
    if (!fs.existsSync(root))
        return [];

    return fs
        .readdirSync(root, { withFileTypes: true })
        .filter(ent => ent.isFile())
        .map(ent => path.resolve(root, ent.name));
};

const loadAlgorithm = (location, remote, type = 'javascript') => {
    const algorithm = require(`./algorithms/${type}`)(location, remote);

    return algorithm;
};

const loadPubs = (root) => {
    const pubsRoot = path.resolve(root, config.paths.pubs);

    if (!fs.existsSync(pubsRoot))
        return;

    return fs
        .readdirSync(pubsRoot, { withFileTypes: true })
        .filter(ent => ent.isFile())
        .map(ent => path.resolve(pubsRoot, ent.name))
        .map(location => loadAlgorithm(location));

};

const loadSubs = (root) => {
    const subsRoot = path.resolve(root, config.paths.subs);

    if (!fs.existsSync(subsRoot))
        return;

    return fs
        .readdirSync(subsRoot, { withFileTypes: true })
        .filter(ent => ent.isFile())
        .map(ent => path.resolve(subsRoot, ent.name))
        .map(location => loadAlgorithm(location));

};

module.exports = load;
