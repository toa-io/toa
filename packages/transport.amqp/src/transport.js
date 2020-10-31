const rascal = require('rascal');
const uuid = require('short-uuid');
const config = require('./config');
const labels = require('./labels');

class Transport {

    constructor(host, label) {
        host = process.env.KOO_TRANSPORT_AMQP_HOST || host;
        const port = process.env.KOO_TRANSPORT_AMQP_PORT || 5672;
        const user = process.env.KOO_TRANSPORT_AMQP_USER || 'guest';
        const secret = process.env.KOO_TRANSPORT_AMQP_SECRET || 'guest';

        this._label = label;

        this._url = `amqp://${user}:${secret}@${host}:${port}/`;
        this._logUrl = `amqp://${user}:${'*'.repeat(secret.length)}@${host}:${port}/`;

        this._hosts = {};
        this._calls = [];

        this._replies = {};
        this._broker = undefined;

        this._suffix = uuid.generate();
    }

    hosts(label, callback) {
        this._hosts[label] = callback;
    }

    calls(label, exclusive) {
        const call = { label, caller: this._label };

        if (exclusive)
            call.suffix = this._suffix;

        this._calls.push(call);
    }

    async connect() {
        if (this._connecting || this._broker)
            return;

        this._connecting = true;
        this._broker = await this._create();
        await this._handleRPC();
        this._connecting = false;

        console.log(`Connected to ${this._logUrl}`);
    }

    async disconnect() {
        if (this._disconnecting || !this._broker)
            return;

        this._disconnecting = true;
        await this._broker.shutdown();
        this._broker = undefined;
        this._disconnecting = false;

        console.log(`Disconnected from ${this._logUrl}`);
    }

    async request(label, payload) {
        const options = {
            correlationId: uuid.uuid(),
            replyTo: labels.key(this._label, this._suffix),
        };

        await this.emit(labels.request(label), payload, { options });

        return new Promise((resolve) => {
            this._replies[options.correlationId] = resolve;
        });
    }

    async emit(label, payload, options = {}) {
        const pub = await this._broker.publish(label, { payload }, options);

        pub.on('error', (e) => console.error(`AMQP publication error: ${e}`));
    }

    async on(label, callback) {
        const sub = await this._broker.subscribe(label);

        sub.on('message', callback);
        sub.on('error', (e) => console.error(`AMQP subscription error: ${e}`));
        sub.on('success', () => {
            console.log('AMQP subscription success');
        });
    }

    async _create() {
        const hosts = Object.keys(this._hosts);
        const calls = this._calls;
        const cfg = rascal.withDefaultConfig(config(this._url, hosts, calls));

        const broker = await rascal.BrokerAsPromised.create(cfg);

        broker.on('error', (e) => console.error(`AMQP broker error: ${e}`));

        return broker;
    }

    async _handleRPC() {
        const subs = [];
        const pubs = [];

        for (const call of this._calls) {
            const reply = labels.reply(call.label, call.caller, call.suffix);

            subs.push(this.on(reply, (message, content, ackOrNack) => {
                const resolve = this._replies[message.properties.correlationId];

                if (resolve)
                    resolve(content.payload);

                ackOrNack();
            }));
        }

        for (const [label, callback] of Object.entries(this._hosts)) {
            pubs.push(this.on(labels.request(label), async (message, content, ackOrNack) => {
                try {
                    const payload = await callback(content.payload);
                    const options = { correlationId: message.properties.correlationId };
                    const routingKey = message.properties.replyTo;

                    await this.emit(labels.reply(label), payload, { routingKey, options });
                } catch (e) {
                    consloe.error(e);
                    ackOrNack(e);
                    return;
                }

                ackOrNack();
            }));
        }

        await Promise.all([Promise.all(subs), Promise.all(pubs)]);
    }

}

Transport.type = 'amqp';

module.exports = Transport;
