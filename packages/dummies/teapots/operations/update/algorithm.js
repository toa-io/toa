module.exports = async ({ input, output }, object) => {
    Object.assign(object, input);
    object.volume = Math.random() + 2;
    output.result = await object._commit();
};
