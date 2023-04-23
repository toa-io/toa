'use strict'

async function observation (input, none, context) {
  const event = { happened: true }

  await context.amqp.bad.emit('bad_event', event)
}

exports.observation = observation
