const equal = require('deep-equal');
const clone = require('clone');
const parse = require('./query');

module.exports = class {

    constructor(connector, schema, options) {
        this._connector = connector;
        this._schema = schema;
        this._options = options;
    }

    async connect() {
        await this._connector.connect();
    }

    async disconnect() {
        await this._connector.disconnect();
    }

    async object(query) {
        let object = undefined;

        const q = this._parse(query, 'object');

        if (q)
            object = await this._connector.get(q);
        else
            object = {};

        let current = clone(object);

        const commit = async () => {
            if (equal(object, current))
                return 1;

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
        const q = this._parse(query, 'collection');

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

    _parse(query, type) {
        return parse(query, this._schema.properties, this._options?.[type]);
    }

};
