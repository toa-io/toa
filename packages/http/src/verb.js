module.exports = (binding) => {
    if (binding.safe)
        return 'GET';

    if (binding.state === 'collection')
        throw new Error('Not implemented');

    return 'PUT'; // TODO
};
