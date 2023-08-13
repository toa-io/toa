'use strict';
const { Connector } = require('@toa.io/core');
const { name } = require('./queues');
/**
 * @implements {toa.core.bindings.Broadcast}
 */
class Broadcast extends Connector {
    /** @type {toa.amqp.Communication} */
    #comm;
    /** @type {toa.core.Locator} */
    #locator;
    /** @type {string} */
    #group;
    constructor(comm, locator, group) {
        super();
        this.#comm = comm;
        this.#locator = locator;
        this.#group = group;
        this.depends(comm);
    }
    async transmit(label, payload) {
        const exchange = name(this.#locator, label);
        await this.#comm.emit(exchange, payload);
    }
    async receive(label, callback) {
        const exchange = name(this.#locator, label);
        await this.#comm.consume(exchange, this.#group, callback);
    }
}
exports.Broadcast = Broadcast;
//# sourceMappingURL=broadcast.js.map