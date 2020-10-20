const http = require('@kookaburra/http');
const compose = require('./compose');

module.exports = async (path) => {
    const server = new http();
    const runtime = await compose(path)

    server.bind(runtime.http);

    await runtime.start();
    server.start();
}
