const string = () => Math.random().toString(36).substring(2);
const labels = require('../src/labels');
const config = require('../src/config');

it('should declare vhost', () => {
    const result = config();

    expect(result).toMatchObject({ vhosts: { '/': {} } });
});

it('should declare connection with retry policy', () => {
    const url = string();
    const connection = config(url).vhosts['/'].connection;

    expect(connection.url).toEqual(url);

    expect(connection.retry).toEqual({
        min: 1000,
        max: 60000,
        factor: 2,
        strategy: 'exponential',
    });
});

const testRequestsQueue = (request, ...args) => {
    const node_env = process.env.NODE_ENV;

    process.env.NODE_ENV = undefined;
    let vhost = config(...args).vhosts['/'];

    expect(vhost.queues[request]).toEqual({ options: { autoDelete: false } });

    process.env.NODE_ENV = 'local';
    vhost = config(...args).vhosts['/'];

    expect(vhost.queues[request]).toEqual({ options: { autoDelete: true } });

    process.env.NODE_ENV = node_env;
};

describe('host', () => {
    const label = string();

    let vhost = undefined;

    beforeEach(() => {
        vhost = config(string(), [label]).vhosts['/'];
    });

    it('should declare requests queue', () => {
        const request = labels.request(label);
        testRequestsQueue(request, string(), [label]);
    });

    it('should declare request subscription', () => {
        const request = labels.request(label);
        const node_env = process.env.NODE_ENV;

        process.env.NODE_ENV = undefined;
        let vhost = config(string(), [label]).vhosts['/'];

        expect(vhost.subscriptions[request]).toEqual({
            queue: request,
            prefetch: 3,
            deferCloseChannel: 10,
        });

        process.env.NODE_ENV = 'local';
        vhost = config(string(), [label]).vhosts['/'];

        expect(vhost.subscriptions[request]).toMatchObject({ deferCloseChannel: 1 });

        process.env.NODE_ENV = node_env;
    });

    it('should declare replies direct exchange', () => {
        const reply = labels.reply(label);

        expect(vhost.exchanges[reply]).toEqual({ type: 'direct' });
    });

    it('should declare replies publication', () => {
        const reply = labels.reply(label);

        expect(vhost.publications[reply]).toEqual({ exchange: reply });
    });
});

describe('call', () => {
    const label = string();

    it('should declare requests queue', () => {
        const request = labels.request(label);
        testRequestsQueue(request, string(), undefined, [{ label }]);
    });

    it('should declare request publication', () => {
        const request = labels.request(label);
        const vhost = config(string(), undefined, [{ label }]).vhosts['/'];

        expect(vhost.publications[request]).toEqual({ queue: request });
    });

    it('should declare replies direct exchange', () => {
        const reply = labels.reply(label);
        const vhost = config(string(), undefined, [{ label }]).vhosts['/'];

        expect(vhost.exchanges[reply]).toEqual({ type: 'direct' });
    });

    it('should declare replies queue', () => {
        const caller = string();
        const reply = labels.reply(label, caller);
        const vhost = config(string(), undefined, [{ label, caller }]).vhosts['/'];

        expect(vhost.queues[reply]).toEqual({ options: { autoDelete: false } });
    });

    it('should declare temporary replies queue for caller with suffix', () => {
        const caller = string();
        const suffix = string();
        const reply = labels.reply(label, caller, suffix);
        const vhost = config(string(), undefined, [{ label, caller, suffix }]).vhosts['/'];

        expect(vhost.queues[reply]).toEqual({ options: { autoDelete: true } });
    });

    it('should declare binding replies exchange to replies queue with routingKey', () => {
        const caller = string();
        const suffix = string();
        const reply_e = labels.reply(label);
        const reply_q = labels.reply(label, caller, suffix);
        const key = labels.key(caller, suffix);
        const vhost = config(string(), undefined, [{ label, caller, suffix }]).vhosts['/'];

        expect(vhost.bindings[reply_q]).toEqual({
            source: reply_e,
            destination: reply_q,
            bindingKey: key,
        });
    });

    it('should declare subscription for replies', () => {
        const caller = string();
        const suffix = string();
        const reply_q = labels.reply(label, caller, suffix);

        const node_env = process.env.NODE_ENV;
        process.env.NODE_ENV = undefined;

        let vhost = config(string(), undefined, [{ label, caller, suffix }]).vhosts['/'];

        expect(vhost.subscriptions[reply_q]).toEqual({
            queue: reply_q,
            prefetch: 3,
            deferCloseChannel: 10,
        });

        process.env.NODE_ENV = 'local';

        vhost = config(string(), undefined, [{ label, caller, suffix }]).vhosts['/'];

        expect(vhost.subscriptions[reply_q]).toMatchObject({ deferCloseChannel: 1 });

        process.env.NODE_ENV = node_env;
    });

});
