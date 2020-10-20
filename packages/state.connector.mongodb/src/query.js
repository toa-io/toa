const criteria = require('./criteria');

module.exports = (query) => {
    const result = { options: {} };

    if (!query)
        return result;

    if (query.criteria)
        result.criteria = criteria(query.criteria);

    result.options = {
         limit: query.limit,
         skip: query.omit,
    };

    if (query.sort)
        result.options.sort = query.sort.reduce((acc, { key, direction }) => {
            acc[key] = direction;
            return acc;
        }, {});

    if (query.projection)
        result.options.projection = query.projection.reduce((acc, prop) => {
            acc[prop] = 1;
            return acc;
        }, {});

    return result;
};
