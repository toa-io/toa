'use strict'

async function effect (_, context) {
  await context.stash.lock('lock id', async () => {
    let value = await context.stash.get('key')

    value++

    await context.stash.set('key', value)
  })
}

exports.effect = effect
