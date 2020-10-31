const labels = require('../src/labels');

it('should create request label', () => {
    expect(labels.request('teapots.add')).toEqual('request.teapots.add');
});

it('should create reply label', () => {
    expect(labels.reply('teapots.add')).toEqual('reply.teapots.add');
});

it('should create reply label for caller', () => {
    expect(labels.reply('teapots.add', 'caller')).toEqual('reply.teapots.add..caller');
});

it('should create reply label for caller with suffix', () => {
    expect(labels.reply('teapots.add', 'caller', 'suffix'))
        .toEqual('reply.teapots.add..caller..suffix');
});
