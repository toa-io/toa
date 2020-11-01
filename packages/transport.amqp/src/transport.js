const rascal = require('rascal');
const uuid = require('short-uuid');
const config = require('./config');
const labels = require('./labels');

class Transport {

    constructor(host, target, source) {
        host = process.env.KOO_TRANSPORT_AMQP_HOST || (process.env.NODE_ENV === 'local' && 'localhost') || host;
        const port = process.env.KOO_TRANSPORT_AMQP_PORT || 5672;
        const user = process.env.KOO_TRANSPORT_AMQP_USER || 'guest';
        const secret = process.env.KOO_TRANSPORT_AMQP_SECRET || 'guest';

        this._target = target;
        this._source = source;

        this._url = `amqp://${user}:${secret}@${host}:${port}/`;
        this._logUrl = `amqp://${user}:${'*'.repeat(secret.length)}@${host}:${port}/`;

        this._hosts = {};
        this._calls = [];
        this._pubs = [];
        this._subs = [];

        this._replies = {};
        this._broker = undefined;

        this._suffix = uuid.generate();
    }

    pubs(label) {
        this._pubs.push(label);
    }

    subs(label, callback) {
        this._subs.push({ label, callback });
    }

    hosts(label, callback) {
        this._hosts[label] = callback;
    }

    calls(label, exclusive) {
        const call = { label };

        if (exclusive)
            call.suffix = this._suffix;

        this._calls.push(call);
    }

    async connect() {
        if (this._connecting || this._broker)
            return;

        this._connecting = true;
        this._broker = await this._create();
        await this._handleSubs();
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
            replyTo: labels.key(this._source, this._suffix),
        };

        await this._publish(labels.request(label), payload, { options });

        return new Promise((resolve) => {
            this._replies[options.correlationId] = resolve;
        });
    }

    async emit(label, payload) {
        return this._publish(labels.pub(this._target, label), payload);
    }

    async _create() {
        const hosts = Object.keys(this._hosts);
        const calls = this._calls;
        const cfg = rascal.withDefaultConfig(
            config(this._url, this._target, this._source, this._pubs, this._subs, hosts, calls),
        );

        const broker = await rascal.BrokerAsPromised.create(cfg);

        broker.on('error', (e) => console.error(`AMQP broker error: ${e}`));

        return broker;
    }

    async _publish(label, payload, options = {}) {
        const pub = await this._broker.publish(label, { payload }, options);

        pub.on('error', (e) => console.error(`AMQP publication error: ${e}`));
    }

    async _subscribe(label, callback) {
        const sub = await this._broker.subscribe(label);

        sub.on('message', callback);
        sub.on('error', (e) => console.error(`AMQP subscription error: ${e}`));
    }

    async _handleSubs() {
        this._subs.map(({ label, callback }) =>
            this._subscribe(labels.sub(label, this._target), async (message, content, ackOrNack) => {
                await callback(content.payload);
                ackOrNack();
            }));
    }

    async _handleRPC() {
        const subs = [];
        const pubs = [];

        for (const call of this._calls) {
            const reply = labels.reply(call.label, this._source, call.suffix);

            subs.push(this._subscribe(reply, async (message, content, ackOrNack) => {
                const resolve = this._replies[message.properties.correlationId];

                if (resolve)
                    await resolve(content.payload);

                ackOrNack();
            }));
        }

        for (const [label, callback] of Object.entries(this._hosts)) {
            pubs.push(this._subscribe(labels.request(label), async (message, content, ackOrNack) => {
                try {
                    const payload = await callback(content.payload);
                    const options = { correlationId: message.properties.correlationId };
                    const routingKey = message.properties.replyTo;

                    await this._publish(labels.reply(label), payload, { routingKey, options });
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
