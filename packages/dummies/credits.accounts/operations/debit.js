function transition({ input, error }, object) {
    if (object.balance < input.amount) {
        error.status = 2;
        error.message = `More credits required (${input.amount - object.balance})`;
        return;
    }

    object.balance -= input.amount;

    console.log(`${input.amount} credits debited, ${object.balance} left`);
}

module.exports = transition;
