const { ObjectID, MongoClient } = require('mongodb');
const parse = require('./query');

const OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    ignoreUndefined: true,
};

class Connector {

    constructor(host, db, collection) {
        this._location = { host, db, collection };
        this._url = process.env.KOO_STATE_CONNECTOR_MONGODB_URL || `mongodb+srv://rw:${this._location.host}`;
        this._client = new MongoClient(this._url, OPTIONS);

        this._collection = undefined;
    }

    async connect() {
        await this._client.connect();

        this._collection = this._client.db(this._location.db).collection(this._location.collection);

        console.log(`Connected to ${this._location.db}.${this._location.collection} at ${this._url}`);
    }

    async disconnect() {
        await this._client.close();

        console.log(`Disconnected from ${this._url}`);
    }

    async get(query) {
        const { criteria, options } = parse(query);
        const object = await this._collection.findOne(criteria, options);

        format(object);

        return object;
    }

    async find(query) {
        const { criteria, options } = parse(query);

        const cursor = await this._collection.find(criteria, options);
        const objects = await cursor.toArray();

        objects.map(format);

        return objects;
    }

    async add(object) {
        const { insertedId, result } = await this._collection.insertOne(object);

        if (result.ok) {
            object._id = insertedId;
            format(object);
        }

        return result.ok;
    }

    async update(object) {
        const document = unformat(object);

        const filter = { _id: document._id };
        const result = await this._collection.findOneAndReplace(filter, document);

        return result.ok;
    }

}

const format = (object) => {
    Object.defineProperty(object, '_id', {
        writable: false,
        configurable: false,
        value: object._id.toHexString(),
    });
};

const unformat = (object) => {
    const document = Object.assign({}, object);

    document._id = ObjectID.createFromHexString(object._id);

    return document;
};

module.exports = Connector;
