async function transition({ input, output, error }, object, runtime) {
    Object.assign(object, input);

    await object._commit();

    const reply = await runtime.remote.credits.accounts.debit(
        { amount: 1 },
        { criteria: `_id==${input.sender}` },
    );

    if (reply.error) {
        Object.assign(error, reply.error);
        return;
    }

    object.status = 'sent';

    await object._commit();

    output._id = object._id;
}

module.exports = transition;
