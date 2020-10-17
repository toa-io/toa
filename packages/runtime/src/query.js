const criteria = require('./query/criteria');

module.exports = (query, properties, options) => {
    const result = {};

    if (query.criteria)
        result.criteria = criteria(query.criteria, properties);

    if (query.sort) {
        const DEFAULT = 'asc';
        const SORT = {
            asc: 1,
            desc: -1,
        };

        result.sort = query.sort.split(',').map((kv) => {
            let [key, direction] = kv.split(':');

            direction = SORT[direction || DEFAULT];

            return { key, direction };
        }, {});
    }

    let omit = +(query.omit);

    if (omit) {
        if (options.omit?.limit && omit > options.omit.limit)
            omit = options.omit.limit;

        result.omit = omit;
    }

    let select = +(query.select || options.select?.default);

    if (select) {
        if (options.select?.limit && select > options.select.limit)
            select = options.select.limit;

        result.select = select;
    }

    const projection = query.projection || options.projection;

    if (projection) {
        projection.forEach((prop) => {
            if (!properties[prop])
                throw new Error(`Schema missing projection property '${prop}'`);
        });

        result.projection = projection;
    }

    return result;
};
