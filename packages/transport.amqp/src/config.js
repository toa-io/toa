const labels = require('./labels');

module.exports = (url, target, source, pubs, subs, hosts, calls) => {
    const config = {
        connection: {},
        exchanges: {},
        bindings: {},
        queues: {},
        publications: {},
        subscriptions: {},
    };

    config.connection = {
        url,
        retry: {
            min: 1000,
            max: 60000,
            factor: 2,
            strategy: 'exponential',
        },
    };

    if (pubs?.length)
        for (const pub of pubs) {
            const event = labels.pub(target, pub);

            config.exchanges[event] = {
                type: 'fanout',
            };

            config.publications[event] = {
                exchange: event,
            };
        }

    if (subs?.length)
        for (const sub of subs) {
            const event = labels.sub(sub.label);
            const queue = labels.sub(sub.label, target);

            config.exchanges[event] = {
                type: 'fanout',
            };

            config.queues[queue] = {
                options: {
                    autoDelete: process.env.NODE_ENV === 'local',
                },
            };

            config.bindings[queue] = {
                source: event,
                destination: queue,
            };

            config.subscriptions[queue] = {
                queue,
                prefetch: 3,
                deferCloseChannel: process.env.NODE_ENV === 'local' ? 1 : 10,
            };


        }

    if (hosts)
        for (const host of hosts) {
            const request = labels.request(host);
            const reply = labels.reply(host);

            config.queues[request] = {
                options: {
                    autoDelete: process.env.NODE_ENV === 'local',
                },
            };

            config.subscriptions[request] = {
                queue: request,
                prefetch: 3,
                deferCloseChannel: process.env.NODE_ENV === 'local' ? 1 : 10,
            };

            config.exchanges[reply] = {
                type: 'direct',
            };

            config.publications[reply] = {
                exchange: reply,
            };

        }

    if (calls)
        for (const call of calls) {
            const request = labels.request(call.label);
            const reply = labels.reply(call.label);
            const reply_q = labels.reply(call.label, source, call.suffix);
            const key = labels.key(source, call.suffix);

            config.queues[request] = {
                options: {
                    autoDelete: process.env.NODE_ENV === 'local',
                },
            };

            config.publications[request] = {
                queue: request,
            };

            config.exchanges[reply] = {
                type: 'direct',
            };

            config.queues[reply_q] = {
                options: {
                    autoDelete: !!call.suffix,
                },
            };

            config.bindings[reply_q] = {
                source: reply,
                destination: reply_q,
                bindingKey: key,
            };

            config.subscriptions[reply_q] = {
                queue: reply_q,
                prefetch: 3,
                deferCloseChannel: process.env.NODE_ENV === 'local' ? 1 : 10,
            };

        }

    return { vhosts: { '/': config } };
};
