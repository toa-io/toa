const path = require('path');

module.exports = (location) => {
    const algorithm = require(location);
    const name = path.basename(location, '.js');

    if (typeof algorithm !== 'function')
        throw new Error(`Operation '${name}' must export function`);

    return { name, algorithm };
};
