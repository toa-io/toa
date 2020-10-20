module.exports = (operation, binding, req) => {
    const query = {};
    const criteria = [];

    if (operation.state === 'collection') {

        ['omit', 'limit', 'sort'].forEach(prop => {
            const sealed = binding.query?.[prop] !== undefined && binding.query?.sealed;
            const value = (!sealed && !binding.query?.frozen && req.query[prop]) || binding.query?.[prop];

            if (value)
                query[prop] = value;
        });

    }

    if (binding.query?.criteria !== undefined)
        criteria.push(binding.query.criteria);

    if (!binding.query?.frozen && req.query.criteria && (binding.query?.criteria === undefined || !binding.query?.sealed))
        criteria.push(req.query.criteria);

    if (Object.keys(req.params).length)
        Object.entries(req.params).map(([name, value]) => criteria.push(`${name}==${value}`));

    if (criteria)
        query.criteria = criteria.join(';');

    return query;
};
