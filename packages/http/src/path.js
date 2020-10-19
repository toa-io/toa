const SEARCH_RE = /{(?<param>[^:]+)(:(?<expression>[^:]+))?}/gm;

module.exports = (input) => {
    const expressions = [];
    const path = input.replace(SEARCH_RE, (_, name, _2, expression) => {
        if (expression)
            expressions.push(expression);

        return expression ? name : `:${name}`;
    });

    return { path, expressions };
};
