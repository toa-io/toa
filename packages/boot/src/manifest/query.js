module.exports = (query, defaults) => {
    if (!query && !defaults)
        return;

    if (!query)
        query = {};

    if (typeof query === 'string')
        query = { criteria: query };

    if (query.limit === undefined)
        query.limit = {};

    if (typeof query.limit !== 'object')
        query.limit = {
            default: query.limit,
            max: query.limit,
        };

    if (!query?.limit.default)
        query.limit.default = defaults?.limit?.default;

    if (!query.limit.max)
        query.limit.max = defaults?.limit?.max;

    if (query.omit === undefined)
        query.omit = {};

    if (typeof query.omit !== 'object')
        query.omit = {
            max: query.omit,
        };

    if (!query.omit.max)
        query.omit.max = defaults?.omit?.max;

    for (const keyword of ['criteria', 'sort', 'sealed', 'frozen', 'projection'])
        if (!query[keyword] && defaults?.[keyword])
            query[keyword] = defaults[keyword];

    if (query.criteria && [',', ';'].includes(query.criteria[0]))
        query.criteria = defaults.criteria + query.criteria;

    return query;
};
