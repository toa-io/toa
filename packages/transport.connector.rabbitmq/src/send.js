const amqp = require('amqplib');

process.on('uncaughtException', (err) =>
    console.error(`uncaughtException ${err}\n${err.stack}`));
process.on('unhandledRejection', (err) =>
    console.error(`unhandledRejection ${err}\n${err.stack}`));

(async () => {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = 'test-queue';
    const message = 'test-message';

    channel.assertQueue(queue, { durable: false });
    channel.sendToQueue(queue, Buffer.from(message));
    console.log(`Sent '${message}'`);

    setTimeout(() => {
        connection.close();
    }, 500);
})();
