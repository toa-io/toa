module.exports = async ({ input, output }, object) => {
    Object.assign(object, input);

    await object._commit();

    output._id = object._id;
};

