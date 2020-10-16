const clone = require('clone');
const mock = require('./connector.fixture');

console.log = () => null;

const mockMongoClient = mock.MongoClient;
const mockObjectID = mock.ObjectID;

jest.mock('mongodb', () => ({
    MongoClient: mockMongoClient,
    ObjectID: mockObjectID,
}));

const Connector = require('../src/connector');

let connector = undefined;

beforeEach(() => {
    jest.clearAllMocks();

    const loc = mock.location;
    connector = new Connector(loc.host, loc.db, loc.collection, mock.schema);
});

it('should create client', () => {
    const url = `mongodb+srv://rw:${mock.location.host}`;

    expect(mock.MongoClient).toBeCalledTimes(1);
    expect(mock.MongoClient.mock.calls[0][0]).toEqual(url);
});

it('should connect', () => {
    connector.connect();
    expect(mock.MongoClient.mock.instances[0].connect).toBeCalledTimes(1);
});

it('should disconnect', () => {
    connector.disconnect();
    expect(mock.MongoClient.mock.instances[0].close).toBeCalledTimes(1);
});

it('should use KOO_STATE_CONNECTOR_MONGODB_URL', () => {
    const url = Math.random().toString();

    process.env.KOO_STATE_CONNECTOR_MONGODB_URL = url;

    jest.clearAllMocks();
    const loc = mock.location;
    connector = new Connector(loc.host, loc.db, loc.collection);

    expect(mock.MongoClient.mock.calls[0][0]).toEqual(url);
});

describe('get', () => {
    let object;

    beforeEach(async () => {
        await connector.connect();
        object = await connector.get(mock.query);
    });

    it('should return object matching criteria', () => {
        const method = mock.Collection.mock.instances[0].findOne;

        expect(method).toBeCalledWith(mock.criteria);
        expect(method.mock.results[0].value).toEqual(object);
    });

    it('should return object with hex string _id ', () => {
        expect(object._id).toEqual(mock.ObjectID.mock.instances[0].toHexString.mock.results[0].value);
    });

});

describe('find', () => {
    let collection = undefined;

    beforeEach(async () => {
        await connector.connect();
        collection = await connector.find(mock.query);
    });

    it('should return array matching criteria and options', () => {
        const method = mock.Collection.mock.instances[0].find;

        expect(collection).toEqual(method.mock.results[0].value.toArray.mock.results[0].value);
        expect(method).toBeCalledWith(mock.criteria, mock.options);
    });

});

describe('add', () => {
    let object = undefined;

    beforeEach(async () => {
        await connector.connect();
        object = { prop: 'test-value' };
    });

    it('should insert document and add _id', async () => {
        await connector.add(object);

        expect(mock.Collection.mock.instances[0].insertOne).toBeCalledTimes(1);
        expect(object._id).toBeDefined();

        const insertOneResult = mock.Collection.mock.instances[0].insertOne.mock.results[0].value;
        expect(object._id).toEqual(insertOneResult.insertedId.toHexString.mock.results[0].value);
    });

    it('should return result', async () => {
        const ok = await connector.add(object);
        const error = await connector.add({ error: 1 });

        expect(ok).toBeTruthy();
        expect(error).toBeFalsy();
    });

});

describe('update', () => {
    const object = { _id: 'test-id', prop: 'test-value' };

    beforeEach(async () => {
        await connector.connect();
    });

    it('should replace document', async () => {
        await connector.update(object);
        const method = mock.Collection.mock.instances[0].findOneAndReplace;

        const filter = { _id: mock.ObjectID.createFromHexString.mock.results[0].value };
        const expected = clone(object);

        delete expected._id;

        expect(method).toBeCalledTimes(1);
        expect(method.mock.calls[0][0]).toEqual(filter);
        expect(method.mock.calls[0][1]).toEqual(expected);
    });

    it('should return result', async () => {
        const ok = await connector.update(object);
        const error = await connector.update({ error: 1 });

        expect(ok).toBeTruthy();
        expect(error).toBeFalsy();
    });

});
