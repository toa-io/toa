module.exports = (before, after) => {
    if (!before._id)
        return after;
};
