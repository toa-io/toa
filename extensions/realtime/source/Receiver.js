"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Receiver = void 0;
const openspan_1 = require("openspan");
const core_1 = require("@toa.io/core");
class Receiver extends core_1.Connector {
    event;
    properties;
    expose;
    stream;
    constructor({ event, properties, stream, expose }) {
        super();
        this.event = event;
        this.properties = properties;
        this.expose = expose;
        this.stream = stream;
    }
    receive(message) {
        // the push continues the trace from the producer
        const telemetry = message.telemetry === undefined ? null : (0, openspan_1.decode)(message.telemetry);
        if (telemetry === null)
            this.process(message, telemetry);
        else
            (0, openspan_1.run)(telemetry, () => this.process(message, telemetry));
    }
    process(message, telemetry) {
        const data = this.fit(message.payload);
        for (const property of this.properties) {
            const key = message.payload[property];
            if (key === undefined) {
                openspan_1.console.debug('Event does not contain key property', { property, event: this.event });
                continue;
            }
            if (Array.isArray(key))
                // eslint-disable-next-line max-depth
                for (const k of key)
                    this.push(k, data, telemetry);
            else
                this.push(key, data, telemetry);
        }
    }
    fit(payload) {
        if (this.expose === undefined)
            return payload;
        const entries = Object.entries(payload)
            .filter(([key]) => this.expose.includes(key));
        return Object.fromEntries(entries);
    }
    push(key, data, telemetry) {
        if (key === null || typeof key === 'undefined') {
            openspan_1.console.debug('Key is null or undefined, skipping', { key, event: this.event });
            return;
        }
        openspan_1.console.debug('Pushing event to stream', { key, event: this.event, data });
        this.stream.push({ key, event: this.event, data, telemetry });
    }
}
exports.Receiver = Receiver;
//# sourceMappingURL=Receiver.js.map