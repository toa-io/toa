module.exports = (req) => {
    if (req.params)
        Object.entries(req.params).forEach(([name, value]) => {
            if (name.substring(0, 8) === '__input_') {
                req.body[name.substring(8)] = value;
            }
        });

    return req.body;
};
