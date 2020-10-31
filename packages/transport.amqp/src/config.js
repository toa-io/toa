const labels = require('./labels');

module.exports = (url, hosts, calls) => {
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
            const reply_q = labels.reply(call.label, call.caller, call.suffix);
            const key = labels.key(call.caller, call.suffix);

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
