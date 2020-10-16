module.exports = async ({ input, output }, object) => {
    Object.assign(object, input);
    output._id = object._id;
};

