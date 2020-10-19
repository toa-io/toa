const path = require('path');

module.exports = (location) => {
    const algorithm = require(location);
    const name = path.basename(location, '.js');

    return { name, algorithm };
};
