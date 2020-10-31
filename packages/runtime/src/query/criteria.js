const rsql = require('@rsql/parser');

const TYPES = {
    'number': Number,
    'boolean': Boolean,
};

let props = undefined;
let equalities = undefined;

const transformations = {
    COMPARISON: (node) => {
        const name = node.left.selector;
        const value = node.right.value;
        const type = props[name] && TYPES[props[name].type];

        if (type)
            node.right.value = type(value);

        if (node.operator === '==' && node.left.type === 'SELECTOR' && node.right.type === 'VALUE')
            equalities[node.left.selector] = node.right.value;
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
    equalities = {};

    transform(ast);

    return { ast, equalities };
};
