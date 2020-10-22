function transition({ input }, object) {
    object.balance += input.amount;
}

module.exports = transition;
