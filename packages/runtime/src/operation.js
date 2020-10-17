const esprima = require('esprima');

const ERROR_NOT_FOUND = {
    status: 4,
    message: 'No matching object(s) found',
};

const ERROR_PERSISTENCE = {
    status: 0,
    message: 'State persistence error',
};

class Operation {

    constructor(endpoint, algorithm, state) {
        this.endpoint = endpoint;

        this._algorithm = algorithm;
        this._state = state;
        this._arguments = parse(this._algorithm);
    }

    async invoke(io, query) {
        let instance = undefined;

        if (this._arguments.state) {
            const method = this._arguments.state;

            if (!this._state[method])
                throw new Error(`State connector does not provide method '${method}'`);

            instance = await this._state[method](query);

            if (!instance) {
                Object.assign(io.error, ERROR_NOT_FOUND);
                return;
            }

        }

        await this._algorithm(io, instance);

        if (instance?._commit && !(await instance?._commit()))
            Object.assign(io.error, ERROR_PERSISTENCE);
    }

}

const parse = (algorithm) => {
    const ALLOWED_IO = ['input', 'output', 'error'];
    const ALLOWED_STATE = ['object', 'collection', 'cursor'];

    const ERROR_FUNCTION = 'Algorithm must be a function';
    const ERROR_IO = `First argument must be a deconstruction with [${ALLOWED_IO.join(', ')}] properties allowed`;
    const ERROR_STATE = `Second argument must be one of [${ALLOWED_STATE.join(', ')}]`;

    const args = {};

    let statement;

    try {
        statement = esprima.parse(algorithm.toString()).body[0];
    } catch (e) {
        throw new Error(`Error parsing algorithm\n${e.message}`);
    }

    const isFunctionExpression = statement.type === 'ExpressionStatement'
        && ['ArrowFunctionExpression', 'FunctionExpression'].includes(statement.expression.type);

    const isFunctionDeclaration = statement.type === 'FunctionDeclaration';

    if (!isFunctionExpression && !isFunctionDeclaration)
        throw new Error(ERROR_FUNCTION);

    const [ioArgument, stateArgument] = isFunctionDeclaration ? statement.params : statement.expression.params;

    if (ioArgument.type !== 'ObjectPattern')
        throw new Error(ERROR_IO);

    if (!ioArgument.properties.every(property => ALLOWED_IO.includes(property.value.name)))
        throw new Error(ERROR_IO);

    args.io = ioArgument.properties.map(property => property.value.name);

    if (stateArgument) {
        if (!ALLOWED_STATE.includes(stateArgument.name))
            throw new Error(ERROR_STATE);

        args.state = stateArgument.name;
    }

    return args;
};

module.exports = Operation;
