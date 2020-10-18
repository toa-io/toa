const mock = require('./fixtures');
jest.mock('../src/schema', () => mock.schema);

const get = require('../src/get');

beforeEach(() => {
    jest.clearAllMocks();
});

it('should define algorithm', () => {
    const state = { name: 'teapots' };
    const descriptor = {};

    get(state, descriptor);

    expect(descriptor.algorithm).toBeDefined();
    expect(descriptor.algorithm).toBeInstanceOf(Function);
});

describe('algorithm', () => {
    let io = undefined;
    let object = undefined;
    let state = undefined;

    beforeEach(async () => {
        const descriptor = mock.descriptor();

        io = mock.io();
        state = mock.state();
        object = mock.object();

        get(state, descriptor);
        await descriptor.algorithm(io, object);
    });

    it('should assign object to output', () => {
        expect(io.output).toEqual(object);
    });

});
