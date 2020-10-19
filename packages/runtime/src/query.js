const criteria = require('./query/criteria');

module.exports = (query, properties, options) => {
    const result = {};

    if (query?.criteria)
        result.criteria = criteria(query.criteria, properties);

    const sort = query?.sort || options?.sort;

    if (sort) {
        const DEFAULT = 'asc';
        const SORT = {
            asc: 1,
            desc: -1,
        };

        result.sort = sort.split(',').map((kv) => {
            let [key, direction] = kv.split(':');

            direction = SORT[direction || DEFAULT];

            return { key, direction };
        }, {});
    }

    let omit = +(query?.omit);

    if (omit) {
        if (options.omit?.limit && omit > options.omit.limit)
            omit = options.omit.limit;

        result.omit = omit;
    }

    let limit = +(query?.limit || options.limit?.default);

    if (limit) {
        if (options.limit?.max && limit > options.limit.max)
            limit = options.limit.max;

        result.limit = limit;
    }

    const projection = query?.projection || options?.projection;

    if (projection) {
        projection.forEach((prop) => {
            if (!properties[prop])
                throw new Error(`Schema missing projection property '${prop}'`);
        });

        result.projection = projection;
    }

    return result;
};
