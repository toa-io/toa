const criteria = require('./query/criteria');

module.exports = (query, properties) => {
    const result = {};

    if (query?.criteria)
        result.criteria = criteria(query.criteria, properties);

    if (query.sort) {
        const DEFAULT = 'asc';
        const SORT = {
            asc: 1,
            desc: -1,
        };

        result.sort = query.sort.split(',').reduce((a, c) => {
            const [key, direction] = c.split(':');

            a[key] = SORT[direction || DEFAULT];

            return a;
        }, {});
    }

    if (query.omit)
        result.omit = +query.omit;

    if (query.select)
        result.select = +query.select;

    return result;
};
