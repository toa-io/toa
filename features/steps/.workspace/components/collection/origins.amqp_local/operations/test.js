'use strict'

async function observation (input, none, context) {
  const event = { happened: true }

  await context.aspects.amqp('target', 'emit', 'test_event', event)
  await context.amqp.target.emit('test_event', event)
}

exports.observation = observation
