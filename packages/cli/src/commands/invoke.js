const path = require('path');
const rjson = require('relaxed-json');

const { construct } = require('@kookaburra/boot');

const invoke = async (component, operation, inputStr, queryStr) => {
    const dir = path.resolve(process.cwd(), component);
    const input = inputStr && JSON.parse(rjson.transform(inputStr));
    const query = queryStr && JSON.parse(rjson.transform(queryStr));

    const runtime = await construct(dir);

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
