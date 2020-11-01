const esprima = require('esprima');

const ERROR_NOT_FOUND = (label, query) => ({
    status: 4,
    message: `No matching object found (${label})`,
    query,
});

const ERROR_QUERY = (label, query) => ({
    message: `Query syntax error (${label})`,
    query,
});

const ERROR_PERSISTENCE = (label) => ({
    status: 0,
    message: `State persistence error (${label})`,
});

class Operation {

    constructor(endpoint, meta, algorithm, state, remotes) {
        this.endpoint = endpoint;

        this._algorithm = algorithm;
        this._state = state;
        this._remotes = remotes;

        const { type, access } = parse(this._algorithm);

        this.type = type;
        this.access = access;
        this.http = meta.http;
    }

    async invoke(io, query) {
        let instance = undefined;

        if (this.access) {
            const method = this.access;

            if (!this._state[method])
                throw new Error(`State connector does not provide method '${method}'`);

            instance = await this._state[method](query);

            if (instance === null) {
                Object.assign(io.error, ERROR_NOT_FOUND(this.endpoint.label, query));
                return;
            }

            if (instance === undefined) {
                Object.assign(io.error, ERROR_QUERY(this.endpoint.label, query));
                return;
            }

            if (this.type === 'observation' || this.access === 'collection')
                Object.freeze(instance);
        }

        const runtime = {};

        runtime.remote = this._remotes;

        await this._algorithm(io, instance, runtime);

        if (this.type === 'transition' && instance?._commit && !(await instance?._commit()))
            Object.assign(io.error, ERROR_PERSISTENCE(this.endpoint.label));
    }

}

const parse = (algorithm) => {
    const ALLOWED_NAMES = ['transition', 'observation'];
    const ALLOWED_IO = ['input', 'output', 'error'];
    const ALLOWED_STATE = ['object', 'collection', 'cursor'];

    const ERROR_FUNCTION = `Algorithm must be a named function declaration with [${ALLOWED_NAMES.join(', ')}] names allowed`;
    const ERROR_IO = `First argument must be a deconstruction with [${ALLOWED_IO.join(', ')}] properties allowed`;
    const ERROR_STATE = `Second argument must be one of [${ALLOWED_STATE.join(', ')}]`;

    const args = {};

    let statement;

    try {
        statement = esprima.parse(algorithm.toString()).body[0];
    } catch (e) {
        throw new Error(`Error parsing algorithm\n${e.message}`);
    }

    if (statement.type !== 'FunctionDeclaration')
        throw new Error(ERROR_FUNCTION);

    const type = statement.id.name;

    if (!ALLOWED_NAMES.includes(type))
        throw new Error(ERROR_FUNCTION);

    const [ioArgument, stateArgument] = statement.params;

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

    return { type, access: args.state };
};

module.exports = Operation;
