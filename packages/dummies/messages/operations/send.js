async function transition({ input, error }, object, runtime) {
    object.sender = input.sender;
    object.recipient = input.recipient;
    object.text = input.text || Math.random().toString(36).substring(2);

    await object._commit();

    const io = await runtime.remote.credits.accounts.debit({ amount: 1 }, { criteria: `user==${input.sender}` });

    if (io.error) {
        error.status = io.status;
        error.message = io.error.message;
        return;
    }

    object.sent = true;
}

module.exports = transition;
