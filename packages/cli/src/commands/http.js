const path = require('path');

const { http } = require('@kookaburra/boot');

const invoke = async (component) => {
    const location = path.resolve(process.cwd(), component);
    await http(location);
};

module.exports = invoke;
