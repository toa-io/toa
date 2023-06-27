'use strict'

const { timeout } = require('@toa.io/generic')

async function effect (input, context) {
  const result = await context.stash.lock('plusing', async () => {
    await timeout(input.delay)

    let value = await context.stash.get('key')

    value++

    await context.stash.set('key', value)

    return value
  })

  console.log('plus:', result)

  return result
}

exports.effect = effect
