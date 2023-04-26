'use strict'

async function effect (input, context) {
  const event = { happened: true }

  await context.amqp.bad.emit('bad_event', event)
}

exports.effect = effect
