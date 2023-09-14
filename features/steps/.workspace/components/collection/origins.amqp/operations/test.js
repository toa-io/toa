'use strict'

async function effect (_, context) {
  const event = { happened: true }

  await context.aspects.amqp('queue', 'emit', 'test_event', event)
  await context.amqp.queue.emit('test_event', event)
}

exports.effect = effect
