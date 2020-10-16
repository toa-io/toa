const LOGIC = {
    'and': '$and',
    ';': '$and',
    'or': '$or',
    ',': '$or',
};

const COMPARISON = {
    '==': '$eq',
    '>': '$gt',
    '>=': '$gte',
    '=in=': '$in',
    '<': '$lt',
    '<=': '$lte',
    '!=': '$ne',
    '=out=': '$nin',
};

const operators = {};

operators.LOGIC = (expression) => {
    const left = transform(expression.left);
    const right = transform(expression.right);

    return { [LOGIC[expression.operator]]: [left, right] };
};

operators.COMPARISON = (expression) => {
    const left = transform(expression.left);
    const right = transform(expression.right);

    return { [left]: { [COMPARISON[expression.operator]]: right } };
};

operators.SELECTOR = (expression) => expression.selector;
operators.VALUE = (expression) => expression.value;

const transform = (ast) => {
    if (!operators[ast.type])
        throw new Error('AST parse error');

    return operators[ast.type](ast);
};

module.exports = transform;
