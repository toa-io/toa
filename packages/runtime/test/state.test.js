const mock = require('./fixtures/state');

jest.mock('../src/query', () => mock.parse)

const State = require('../src/state');

let state;

beforeEach(() => {
    jest.clearAllMocks();

    state = new State(mock.connector, mock.schema, mock.options);
});

it('should connect', () => {
    state.connect();

    expect(mock.connector.connect).toBeCalledTimes(1);
});

it('should disconnect', async () => {
    state.disconnect();

    expect(mock.connector.disconnect).toBeCalledTimes(1);
});

describe('object', () => {

    it('should get object matching criteria', async () => {
        const object = await state.object(mock.query);

        expect(mock.connector.get).toBeCalledTimes(1);
        expect(mock.parse).toBeCalledTimes(1);
        expect(mock.parse).toBeCalledWith(mock.query, mock.schema.properties, mock.options);
        expect(mock.connector.get).toBeCalledWith(mock.parse.mock.results[0].value);
        expect(object).toEqual(mock.connector.get.mock.results[0].value);
    });

    it('should add new object', async () => {
        const object = await state.object();
        object.foo = 'bar';

        const result = await object._commit();

        expect(mock.connector.add).toBeCalledTimes(1);
        expect(mock.connector.add).toBeCalledWith(object);

        expect(result).toStrictEqual(1);
        expect(object._id).toBeDefined();
    });

    it('should update object', async () => {
        const object = await state.object(mock.query);
        object.foo = 'bar';

        await object._commit();

        expect(mock.connector.update).toBeCalledTimes(1);
        expect(mock.connector.update).toBeCalledWith(object);
    });

    it('shouldn`t update unchanged object', async () => {
        const object = await state.object(mock.query);

        const result = await object._commit();

        expect(mock.connector.update).toBeCalledTimes(0);
        expect(result).toStrictEqual(1);
    });

    it('should throw if object doesnt match schema', async () => {
        const object = await state.object(mock.query);
        object.error = true;

        await expect(() => object._commit()).rejects.toThrow(mock.schema.error);
    });

});

describe('collection', () => {

    it('should return collection query', async () => {
        const collection = await state.collection(mock.query);

        expect(mock.connector.find).toBeCalledTimes(1);
        expect(mock.parse).toBeCalledTimes(1);
        expect(mock.parse).toBeCalledWith(mock.query, mock.schema.properties, mock.options);

        expect(mock.connector.find).toBeCalledWith(mock.parse.mock.results[0].value);
        expect(collection).toEqual(mock.connector.find.mock.results[0].value);
    });

});
