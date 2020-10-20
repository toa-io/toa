module.exports = class {

    constructor(promise) {
        this._promise = promise;
    }

    async connect() {
        const runtime = await this._promise;

        Object.defineProperty(this, '__runtime', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: runtime,
        });

        await runtime.start();

        delete this.connect;
        delete this._promise;

        for (const [name, operation] of Object.entries(runtime.operations))
            this[name] = (...args) => runtime.invoke(operation, ...args);
    }

};
