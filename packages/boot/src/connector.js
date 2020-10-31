const DEFAULT = 'mongodb';

const MODULE = {
    'mongodb': '@kookaburra/state.mongodb',
};

// TODO: implement singleton

module.exports = (locator, manifest) => {
    const type = manifest.connector || DEFAULT;

    let Connector;

    try {
        const module = MODULE[type] || type;
        Connector = require(module);
    } catch (e) {
        throw new Error(`Error loading '${type}' state connector\n${e}`);
    }

    const host = locator.host(type);

    return new Connector(host, locator.domain, manifest.name);
};
