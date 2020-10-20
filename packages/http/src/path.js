const SEARCH_RE = /{(.+?)}/gm;

module.exports = (input) => {
    const params = [];

    const route = input.replace(SEARCH_RE, (_, name) => {
        if (name[0] === '*')
            name = `__${name.substring(1)}`;

        params.push(name);
        return `:${name}`;
    });

    return { params, route };
};
