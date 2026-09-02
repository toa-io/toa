"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Routes = void 0;
const node_stream_1 = require("node:stream");
const openspan_1 = require("openspan");
const core_1 = require("@toa.io/core");
const Receiver_js_1 = require("./Receiver.js");
class Routes extends core_1.Connector {
    events = new Events();
    boot;
    constructor(boot) {
        super();
        this.boot = boot;
    }
    static read() {
        if (process.env.TOA_REALTIME === undefined)
            throw new Error('TOA_REALTIME is not defined');
        return JSON.parse(process.env.TOA_REALTIME);
    }
    async open() {
        const routes = Routes.read();
        const creating = [];
        for (const { event, properties, expose } of routes) {
            const consumer = this.boot.receive(event, new Receiver_js_1.Receiver({ event, properties, stream: this.events, expose }));
            creating.push(consumer);
        }
        const consumers = await Promise.all(creating);
        // eslint-disable-next-line @typescript-eslint/promise-function-async
        const connecting = consumers.map((consumer) => consumer.connect());
        await Promise.all(connecting);
        this.depends(consumers);
        openspan_1.console.info('Event sources connected', { count: creating.length });
    }
    async close() {
        openspan_1.console.info('Event sources disconnected');
    }
}
exports.Routes = Routes;
class Events extends node_stream_1.Readable {
    constructor() {
        super({ objectMode: true });
    }
    _read() {
    }
}
//# sourceMappingURL=Routes.js.map