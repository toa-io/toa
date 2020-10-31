const criteria = require('./query/criteria');

const QUERY_KEYWORDS = ['criteria', 'omit', 'limit', 'sort', 'projection'];

const parse = (query, properties, options) => {
    const result = {};

    if (!query || !Object.keys(query).length)
        return;

    if (query)
        for (const key of Object.keys(query))
            if (!QUERY_KEYWORDS.includes(key))
                throw new parse.QueryError(`Unknown query keyword '${key}' only (${QUERY_KEYWORDS.join(', ')}) are supported`);

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

    const omit = +query.omit;

    if (omit)
        result.omit = Math.min(omit, options.max.omit);

    const limit = +query.limit || options.max.limit;

    if (limit)
        result.limit = Math.min(limit, options.max.limit);

    const projection = query.projection || options?.projection;

    if (projection) {
        projection.forEach((prop) => {
            if (!properties[prop])
                throw new Error(`Schema missing projection property '${prop}'`);
        });

        result.projection = projection;
    }

    return Object.keys(result).length ? result : undefined;
};

parse.QueryError = class extends Error {}

module.exports = parse;
