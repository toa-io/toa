module.exports = (binding, req, expressions) => {
    const query = {};
    const criteria = [];

    if (binding.state === 'collection') {
        ['omit', 'limit', 'sort'].forEach(prop => {
            if (req.query[prop])
                query[prop] = req.query[prop]
        });

        if (req.query.criteria)
            criteria.push(req.query.criteria);
    }

    if (Object.keys(req.params).length) {
        criteria.push(Object.entries(req.params).map(([name, value]) => `${name}==${value}`));
    }

    if (expressions?.length)
        expressions.map(e => criteria.push(e));

    if (criteria)
        query.criteria = criteria.join(';')

    return query;
};
