const string = () => Math.random().toString(36).substring(2);

const schema = jest.fn(() => string());

const blank = () => {
    const object = {};

    Object.defineProperty(object, '_commit', {
        enumerable: false,
        value: () => {
            object._id = string();
        },
    });

    return object;
};

const object = () => {
    const object = blank();
    object._id = string();

    return object;
}

const collection = () => [string(), string(), string()];

const io = () => ({
    input: {
        a: string(),
        b: string(),
    },
    output: {},
});

const state = () => ({
    name: string(),
});

const descriptor = () => ({});

module.exports = { schema, blank, object, collection, io, state, descriptor };
