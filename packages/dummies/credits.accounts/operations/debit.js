function transition({ input, error }, object) {
    if (object.balance < input.amount) {
        error.status = 2;
        error.message = `More credits required (${input.amount - object.balance})`;
        return;
    }

    object.balance -= input.amount;
}

module.exports = transition;
