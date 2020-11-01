const equal = require('deep-equal');
const clone = require('clone');
const parse = require('./query');

module.exports = class {

    constructor(connector, schema, options, hooks = []) {
        this.manifest = schema.manifest;

        this._connector = connector;
        this._schema = schema;
        this._options = options;
        this._hooks = hooks;
    }

    async connect() {
        await this._connector.connect();
    }

    async disconnect() {
        await this._connector.disconnect();
    }

    async object(query) {
        let object = undefined;
        let q = undefined;

        try {
            q = this._parse(query);
        } catch (e) {
            if (e instanceof parse.QueryError)
                throw e;

            return;
        }

        if (q?.query)
            object = await this._connector.get(q.query);
        else
            object = {};

        if (object === null && this._options.inserted) {
            object = {};
            Object.assign(object, q.equalities);
            this._validate(object);
        }

        if (object === null)
            return null;

        let current = clone(object);

        const commit = async () => {
            if (equal(object, current))
                return 1;

            this._validate(object);

            const options = { upsert: this._options.inserted };
            const result = object._id ? this._connector.update(object, options) : this._connector.add(object);

            for (const hook of this._hooks)
                hook.handle(current, object);

            current = clone(object);

            return result;
        };

        Object.defineProperty(object, '_commit', {
            configurable: false,
            writable: false,
            enumerable: false,
            value: commit,
        });

        return object;
    }

    async collection(query) {
        let q = undefined;

        try {
            q = this._parse(query);
        } catch (e) {
            if (e instanceof parse.QueryError)
                throw e;

            return;
        }

        return this._connector.find(q.query);
    }

    _validate(object) {
        const copy = clone(object);

        Object.keys(copy).forEach((key) => {
            if (key[0] === '_')
                delete copy[key];
        });

        if (!this._schema.fit(copy))
            throw new Error(this._schema.error);
    }

    _parse(query) {
        return parse(query, this._schema.properties, this._options);
    }

};
