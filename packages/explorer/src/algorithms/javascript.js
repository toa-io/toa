const path = require('path');

module.exports = (location, meta) => {
    const name = path.basename(location, '.js');

    let algorithm = undefined;

    if (!meta) {
        algorithm = require(location);

        if (typeof algorithm !== 'function')
            throw new Error(`Operation '${name}' must export function`);
    }

    return { name, algorithm };
};
