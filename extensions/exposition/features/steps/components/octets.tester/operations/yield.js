'use strict'

import { setTimeout } from 'node:timers/promises'

async function * effect (_) {
  await setTimeout(10)
  yield 'hello'

  await setTimeout(10)
  yield 'world'
}

exports.effect = effect
