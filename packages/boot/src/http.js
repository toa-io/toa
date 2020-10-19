const http = require('@kookaburra/http');
const construct = require('./construct');

module.exports = async (path) => {
    const server = new http();
    const runtime = await construct(path)

    server.bind(runtime.http);

    await runtime.start();
    server.start();
}
