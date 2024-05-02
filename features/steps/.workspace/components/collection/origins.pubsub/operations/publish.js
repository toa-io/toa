'use strict'

async function effect (input, context) {
  return await context.aspects.pubsub('publish', 'test', input)
  //await context.pubsub.test.publish({ hello: 'world' })
}

exports.effect = effect
