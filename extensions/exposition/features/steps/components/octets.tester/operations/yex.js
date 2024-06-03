'use strict'

import { setTimeout } from 'node:timers/promises'

async function * effect (_) {
  await setTimeout(10)
  yield 'hello'

  await setTimeout(10)
  yield 'world'

  await setTimeout(10)
  throw new Error('Oops!')
}

exports.effect = effect
