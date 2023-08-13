'use strict'

async function effect (input, context) {
  return await context.stash.lock('plusing', async () => {
    await new Promise((resolve) => setTimeout(resolve, input.delay))

    let value = await context.stash.get('key')

    value++

    await context.stash.set('key', value)

    return value
  })
}

exports.effect = effect
