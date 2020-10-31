module.exports = class {

    constructor(runtime, transport) {
        this._runtime = runtime;
        this._transport = transport;
    }

    declare() {
        if (this._runtime.operations)
            for (const [, operation] of Object.entries(this._runtime.operations))
                this._transport.hosts(operation.endpoint.label, async (request) => {
                        const io = await this._runtime.invoke(operation, request.input, request.query);
                        return io;
                    },
                );
    }

    async start() {
        this.declare();
        await this._transport.connect();

        console.log(`Runtime '${this._runtime.locator.label}' hosted`);
    }

    async stop() {
        await this._transport.disconnect();
    }

};
