const rsql = require('@rsql/parser');

const TYPES = {
    'number': Number,
    'boolean': Boolean,
};

let props;

const transformations = {
    COMPARISON: (node) => {
        const name = node.left.selector;
        const value = node.right.value;
        const type = props[name] && TYPES[props[name].type];

        if (type)
            node.right.value = type(value);
    }
};

const transform = (node) => {
    if (transformations[node.type])
        transformations[node.type](node);

    if (node.left) {
        transform(node.left);
        transform(node.right);
    }
};

module.exports = (criteria, properties) => {
    const ast = rsql.parse(criteria);

    props = properties;

    transform(ast);

    return ast;
};
