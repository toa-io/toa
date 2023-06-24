'use strict'

async function effect (_, context) {
  await context.stash.lock('plusing', async () => {
    let value = await context.stash.get('key')

    value++

    await context.stash.set('key', value)
  })
}

exports.effect = effect
