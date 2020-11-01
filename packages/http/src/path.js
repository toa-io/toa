const SEARCH_RE = /{(.+?)}/gm;

module.exports = (input) => {
    const params = [];

    const route = input.replace(SEARCH_RE, (_, name) => {
        if (name[0] === '*')
            name = `__pointer_${name.substring(1)}`;

        if (name[0] === '.')
            name = `__input_${name.substring(1)}`;

        params.push(name);
        return `:${name}`;
    });

    return { params, route };
};
