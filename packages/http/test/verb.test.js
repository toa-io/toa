const verb = require('../src/verb');

it('should return get if operation is safe', () => {
    const result = verb({ safe: true }, []);

    expect(result).toEqual('get');
});

it('should return put if operation is unsafe and param _id is defined', () => {
    const result = verb({}, ['_id']);

    expect(result).toEqual('put');
});

it('should return post if operation is unsafe and param _id is not defined', () => {
    const result = verb({}, []);

    expect(result).toEqual('post');
});
