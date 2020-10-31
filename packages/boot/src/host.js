const HTTP = require('@kookaburra/http');
const compose = require('./compose');

module.exports = async (path) => {
    const http = new HTTP();
    const runtime = await compose(path)

    http.bind(runtime.http);

    try {
        await runtime.start();
    } catch (e) {
        console.error(e);
        await runtime.stop();
        process.exit(1);
    }

    await http.start();

    for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT'])
        process.on(signal, async () => {
            await http.stop();
            await runtime.stop();
            process.exit(0);
        });
}
