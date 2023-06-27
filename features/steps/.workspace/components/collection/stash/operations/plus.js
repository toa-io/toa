'use strict'

async function effect (input, context) {
  const result = await context.stash.lock('plusing', async () => {
    await new Promise((resolve) => setTimeout(resolve, input.delay))

    let value = await context.stash.get('key')

    value++

    await context.stash.set('key', value)

    return value
  })

  console.log('plus:', result)

  return result
}

exports.effect = effect
