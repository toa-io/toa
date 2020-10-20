const path = require('path');
const rjson = require('relaxed-json');

const { compose } = require('@kookaburra/boot');

const invoke = async (component, operation, inputStr, queryStr) => {
    const dir = path.resolve(process.cwd(), component);
    const input = inputStr ? JSON.parse(rjson.transform(inputStr)) : undefined;
    const query = queryStr ? JSON.parse(rjson.transform(queryStr)) : undefined;

    const runtime = await compose(dir);

    await runtime.start();

    let result;

    try {
        result = await runtime.invoke(operation, input, query);
    } finally {
        await runtime.stop();
    }

    return result;
};

module.exports = invoke;
