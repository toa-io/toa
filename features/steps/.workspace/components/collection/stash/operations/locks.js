'use strict'

async function effect (_, context) {
  const one = context.local.plus()
  const two = context.local.plus()
  const three = context.local.plus()

  await Promise.all([one, two, three])
}

exports.effect = effect
