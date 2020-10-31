const path = require('path');

const { host } = require('@kookaburra/boot');

const invoke = async (component) => {
    const location = path.resolve(process.cwd(), component);
    await host(location);
};

module.exports = invoke;
