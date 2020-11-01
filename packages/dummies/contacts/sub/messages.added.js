const sender = (payload) => ({
    operation: 'update',
    input: {
        label: payload.text,
    },
    query: `_id==${payload.sender};contact==${payload.recipient}`,
});

const recipient = (payload) => ({
    operation: 'update',
    input: {
        label: payload.text,
    },
    query: `_id==${payload.recipient};contact==${payload.sender}`,
});

module.exports = (payload) => {
    return [sender(payload), recipient(payload)];
};
