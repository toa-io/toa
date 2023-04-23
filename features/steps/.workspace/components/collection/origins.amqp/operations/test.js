'use strict'

async function observation (input, none, context) {
  const event = { happened: true }

  await context.amqp.queue.emit('test_event', event)
}

exports.observation = observation
