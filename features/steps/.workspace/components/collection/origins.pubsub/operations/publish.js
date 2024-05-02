'use strict'

async function effect (input, context) {
  // return await context.aspects.pubsub('publish', 'test', input)
  return await context.pubsub.test.publish(input)
}

exports.effect = effect
