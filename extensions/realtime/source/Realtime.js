"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Realtime = void 0;
const openspan_1 = require("openspan");
const core_1 = require("@toa.io/core");
class Realtime extends core_1.Connector {
    discovery;
    streams = null;
    constructor(routes, discovery) {
        super();
        this.discovery = discovery;
        routes.events.on('data', this.push.bind(this));
    }
    async open() {
        // the lookup belongs here, not in the constructor: dependencies connect before
        // open, so the composition that serves realtime.streams is up to answer it. Asked
        // any earlier the lookup goes unanswered, and it waits without a bound.
        this.streams = await this.discovery();
        this.depends(this.streams);
        await this.streams.connect();
        openspan_1.console.info('Realtime service started');
    }
    dispose() {
        openspan_1.console.info('Realtime service shutdown complete');
    }
    push({ telemetry, ...event }) {
        const processing = telemetry === null
            ? this.deliver(event)
            : (0, openspan_1.run)(telemetry, async () => await this.deliver(event));
        void processing.catch((error) => openspan_1.console.error('Realtime push failed', error));
    }
    async deliver(event) {
        /*
         * The delivery span is created on behalf of the messaging destination
         * (same as the core Receiver), so that service graphs display the fan-out:
         * producer -> destination -> realtime
         */
        const delivery = {
            name: `${event.event} deliver`,
            kind: 'producer',
            service: event.event,
            attributes: { 'messaging.destination.name': event.event }
        };
        const options = {
            name: `${event.event} push`,
            kind: 'consumer',
            service: 'realtime',
            attributes: { 'messaging.destination.name': event.event }
        };
        await openspan_1.console.span(delivery, async () => await openspan_1.console.span(options, async () => {
            await this.streams?.invoke('push', { input: event });
        }));
    }
}
exports.Realtime = Realtime;
//# sourceMappingURL=Realtime.js.map