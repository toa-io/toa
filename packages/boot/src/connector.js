const DEFAULT = 'mongodb';

const MODULE = {
    'mongodb': '@kookaburra/state.connector.mongodb',
};

module.exports = (locator, manifest) => {
    const type = manifest.connector || DEFAULT;

    let Connector;

    try {
        const module = MODULE[type] || type;
        Connector = require(module);
    } catch {
        throw new Error(`Unresolved state connector '${type}'`);
    }

    const host = locator.host(type);

    return new Connector(host, locator.domain, manifest.name);
};
