'use strict'

import { setTimeout } from 'node:timers/promises'

async function bar (input, context) {
  await setTimeout(10)

  return { bar: 'baz' }
}

exports.effect = bar
