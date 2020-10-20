module.exports = (query) => {
    const DEFAULT_LIMIT_DEFAULT = 100;
    const DEFAULT_LIMIT_MAX = 1000;
    const DEFAULT_OMIT_MAX = 10000;

    if (query.limit === undefined)
        query.limit = {};

    if (typeof query.limit !== 'object')
        query.limit = {
            default: query.limit,
            max: query.limit,
        };

    if (!query?.limit.default)
        query.limit.default = DEFAULT_LIMIT_DEFAULT;

    if (!query.limit.max)
        query.limit.max = DEFAULT_LIMIT_MAX;

    if (query.omit === undefined)
        query.omit = {};

    if (typeof query.omit !== 'object')
        query.omit = {
            max: query.omit,
        };

    if (!query.omit.max)
        query.omit.max = DEFAULT_OMIT_MAX;

    return query;
};
