const HTTP = require('@kookaburra/http');
const { Host } = require('@kookaburra/runtime');
const compose = require('./compose');
const transport = require('./transport');

module.exports = async (path) => {
    const http = new HTTP();
    const runtime = await compose(path)
    http.bind(runtime.http);

    // TODO should host composition as well
    const transporter = transport(runtime.locator);
    const host = new Host(runtime, transporter);

    try {
        await runtime.start();
    } catch (e) {
        console.error(e);
        await runtime.stop();
        process.exit(1);
    }

    await host.start();
    await http.start();

    for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT'])
        process.on(signal, async () => {
            await http.stop();
            await host.stop();
            await runtime.stop();
            process.exit(0);
        });
}
