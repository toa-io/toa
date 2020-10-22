const amqp = require('amqplib');

process.on('uncaughtException', (err) =>
    console.error(`uncaughtException ${err}\n${err.stack}`));
process.on('unhandledRejection', (err) =>
    console.error(`unhandledRejection ${err}\n${err.stack}`));

(async () => {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = 'test-queue';

    channel.assertQueue(queue, { durable: false });
    console.log(`Waiting for messages in '${queue}'`);

    channel.consume(queue, (message) => {
        console.log(`Received '${message.content.toString()}'`);
    }, {
        noAck: true,
    });

})();
