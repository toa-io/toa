module.exports = (binding, params) => {
    if (binding.safe)
        return 'get';

    if (binding.state === 'collection')
        throw new Error('Collection transitions not supported yet');

    if (params.includes('_id'))
        return 'put';

    return 'post';
};
