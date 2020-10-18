const mock = require('./fixtures');
jest.mock('../src/schema', () => mock.schema);

const find = require('../src/find');

beforeEach(() => {
    jest.clearAllMocks();
});

it('should define algorithm', () => {
    const state = { name: 'teapots' };
    const descriptor = {};

    find(state, descriptor);

    expect(descriptor.algorithm).toBeDefined();
    expect(descriptor.algorithm).toBeInstanceOf(Function);
});

describe('algorithm', () => {
    let io = undefined;
    let collection = undefined;
    let state = undefined;

    beforeEach(async () => {
        const descriptor = mock.descriptor();

        io = mock.io();
        state = mock.state();
        collection = mock.collection();

        find(state, descriptor);
        await descriptor.algorithm(io, collection);
    });

    it('should assign collection to output property with name equal to state name', () => {
        expect(io.output[state.name]).toEqual(collection);
    });

});
