class Runtime {

    constructor(locator, transport, operations, subs, connectors) {
        this.locator = locator;
        this.connectors = connectors;

        this.operations = {};
        this.http = [];

        this._transport = transport;

        operations.forEach((operation) => this.configure(operation));

        if (subs)
            subs.forEach((sub) => this.sub(sub));
    }

    configure(operation) {
        this.operations[operation.endpoint.name] = operation;

        if (operation.http) {
            this.http.push({
                bindings: operation.http,
                safe: operation.type === 'observation',
                state: operation.access,
                invoke: (...args) => this.invoke(operation, ...args),
            });
        }

        if (this._transport)
            this._transport.hosts(operation.endpoint.label,
                async (request) => await this.invoke(operation, request.input, request.query),
            );

    }

    sub(sub) {
        this._transport.subs(sub.name, (payload) => {
            let invocations = sub.algorithm(payload);

            if (!(invocations instanceof Array))
                invocations = [invocations];

            for (const invocation of invocations) {
                if (!invocation)
                    return;

                this.invoke(invocation.operation, invocation.input, invocation.query);
            }
        });
    }

    async invoke(name, input, query) {
        const io = { input, output: {}, error: {} };

        Object.freeze(io);

        const operation = typeof name === 'string' ? this.operations[name] : name;

        if (!operation)
            throw new Error(`Operation '${name}' not found`);

        await operation.invoke(io, query);

        const result = {};

        if (Object.keys(io.output).length)
            result.output = io.output;

        if (Object.keys(io.error).length)
            result.error = io.error;

        return result;
    }

    async start() {
        if (this._starting)
            return;

        this._starting = true;

        if (this.connectors)
            await Promise.all(this.connectors.map((connector) => connector.connect && connector.connect()));

        if (this._transport)
            await this._transport.connect();

        this._starting = false;

        console.log(`Runtime '${this.locator.label}' started`);
    }

    async stop() {
        if (this._stopping)
            return;

        this._stopping = true;

        if (this._transport)
            await this._transport.disconnect();

        if (this.connectors)
            await Promise.all(this.connectors.map(
                (connector) => connector.__runtime ? connector.__runtime.stop() : connector.disconnect(),
            ));

        this._stopping = false;

        console.log(`Runtime '${this.locator.label}' stopped`);
    }

}

module.exports = Runtime;
