const SEARCH_RE = /{(.+?)}/gm;

module.exports = (input) => {
    const params = [];

    const route = input.replace(SEARCH_RE, (_, name) => {
        params.push(name);
        return `:${name}`;
    });

    return { params, route };
};
