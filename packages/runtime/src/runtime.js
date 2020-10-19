class Runtime {

    constructor(locator, operations, connectors) {
        this.locator = locator;
        this.connectors = connectors;

        this.operations = {};
        this.http = [];

        operations.forEach((operation) => {
            this.operations[operation.endpoint.name] = operation;

            if (operation.http) {
                const descriptor = {
                    routes: operation.http,
                    safe: operation.type === 'observation',
                    state: operation.access,
                    invoke: (...args) => this.invoke(operation, ...args),
                }

                this.http.push(descriptor)
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
        if (this.connectors)
            await Promise.all(this.connectors.map((connector) => connector.connect()));

        console.log(`Runtime started`);
    }

    async stop() {
        if (this.connectors)
            await Promise.all(this.connectors.map((connector) => connector.disconnect()));

        console.log(`Runtime stopped`);
    }

}

module.exports = Runtime;
