const string = () => Math.random().toString(36).substring(2);


const ObjectID = jest.fn(function (value) {
    this['instance'] = string();
    this.toHexString = jest.fn(() => value || string());
});

ObjectID.createFromHexString = jest.fn((value) => { return new ObjectID(value); });

const Collection = jest.fn().mockImplementation(function () {

    this.findOne = jest.fn(() => ({
        _id: new ObjectID(),
        prop: string(),
    }));

    this.find = jest.fn(() => ({
        toArray: jest.fn(() => ([
            {
                _id: new ObjectID(string()),
                prop: string(),
            },
            {
                _id: new ObjectID('2'),
                prop: Math.random(),
            },
        ])),
    }));

    this.insertOne = jest.fn((object) => ({
        result: { ok: object.error ? 0 : 1 },
        insertedId: new ObjectID(string()),
    }));

    this.findOneAndReplace = jest.fn((criteria, object) => ({ ok: object.error ? 0 : 1 }));
});

const MongoClient = jest.fn().mockImplementation(function () {
    this.db = jest.fn(() => ({
        collection: jest.fn(() => new Collection()),
    }));

    this.connect = jest.fn(() => 1);
    this.close = jest.fn(() => 1);
});

const location = {
    host: string(),
    db: string(),
    collection: string(),
};

const query = {
    criteria: {
        left: {
            type: 'SELECTOR',
            selector: 'id',
        },
        type: 'COMPARISON',
        operator: '==',
        right: {
            type: 'VALUE',
            value: 100500,
        },
    },
    omit: 100,
    select: 10,
    sort: {
        a: 1,
        b: -2,
    },
};

const criteria = {
    'id': {
        '$eq': 100500,
    },
};

const options = {
    limit: 10,
    skip: 100,
    sort: {
        a: 1,
        b: -2,
    },
};

module.exports = { ObjectID, MongoClient, location, criteria, query, Collection, options };
