const equal = require('deep-equal');
const clone = require('clone');
const parse = require('./query');

module.exports = class {

    constructor(connector, schema) {
        this._connector = connector;
        this._schema = schema;
    }

    async connect() {
        await this._connector.connect();
    }

    async disconnect() {
        await this._connector.disconnect();
    }

    async object(query) {
        let object = undefined;

        const q = this._parse(query);

        if (q.criteria)
            object = await this._connector.get(q.criteria);
        else
            object = {};

        let current = clone(object);

        const commit = async () => {
            if (equal(object, current))
                return true;

            this._validate(object);
            current = clone(object);

            return object._id ? this._connector.update(object) : this._connector.add(object);
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
        const q = this._parse(query);

        q.projection = this._schema.projection;

        return this._connector.find(q);
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
        return parse(query, this._schema.properties);
    }

};
