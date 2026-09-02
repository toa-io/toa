"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Aspect = void 0;
const openspan_1 = require("openspan");
const core_1 = require("@toa.io/core");
const configuration_js_1 = require("./configuration.js");
const epoch_js_1 = require("./epoch.js");
class Aspect extends core_1.Connector {
    name = 'configuration';
    locator;
    manifest;
    client;
    epoch;
    value = {};
    created = 0;
    /**
     * Without a client the value is local: the variable, the defaults and the schema.
     * With one, the value is what the service holds, and it follows the service.
     */
    constructor(locator, manifest, client) {
        super();
        this.locator = locator;
        this.manifest = manifest;
        this.client = client;
        this.epoch = (0, epoch_js_1.epoch)(manifest.schema);
        if (client !== null)
            this.depends(client);
    }
    invoke(path) {
        let cursor = this.value;
        if (path !== undefined)
            for (const segment of path)
                cursor = cursor[segment];
        return cursor;
    }
    async open() {
        if (this.client === null) {
            this.value = (0, configuration_js_1.local)(this.locator, this.manifest);
            return;
        }
        const { configuration, created } = await this.client.fetch(this.locator.id, this.epoch);
        this.value = (0, configuration_js_1.fit)(configuration, this.manifest);
        this.created = created;
        this.client.subscribe(this.locator.id, this.epoch, this.listener);
    }
    async close() {
        this.client?.unsubscribe(this.locator.id, this.epoch, this.listener);
    }
    listener = ({ configuration, created }) => {
        // deliveries may repeat or cross: only what is newer than the held value replaces it
        if (created <= this.created)
            return;
        try {
            this.value = (0, configuration_js_1.fit)(configuration, this.manifest);
            this.created = created;
            openspan_1.console.info('Configuration updated', { component: this.locator.id, created });
        }
        catch (error) {
            // the service validated it against the schema of its epoch, so the two schemas differ
            openspan_1.console.error('Configuration value does not match the schema', { component: this.locator.id, error });
        }
    };
}
exports.Aspect = Aspect;
//# sourceMappingURL=Aspect.js.map