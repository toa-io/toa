const MODULE = {
    'amqp': '@kookaburra/transport.amqp',
};

const instances = {};

module.exports = (locator, source) => {
    const type = locator.transport;

    let Transport;

    try {
        const module = MODULE[type];
        Transport = require(module);
    } catch(e) {
        throw new Error(`Unresolved transport '${type}'\n${e}`);
    }

    const host = locator.host(Transport.type);

    if (!instances[Transport.type])
        instances[Transport.type] = {};

    if (!instances[Transport.type][host])
        instances[Transport.type][host] = new Transport(host, locator.label, source?.label);

    return instances[Transport.type][host];
};
