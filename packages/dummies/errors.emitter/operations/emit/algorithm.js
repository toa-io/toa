module.exports = ({ input, error }) => {
    error.name = input.name || 'TestError';
    error.message = input.message || 'Test error message';
};
