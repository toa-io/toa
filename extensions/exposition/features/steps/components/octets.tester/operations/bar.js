'use strict'

import { setTimeout } from 'node:timers/promises'

async function bar (input, context) {
  await setTimeout(10)
  await context.storages.octets.annotate(input.path, 'bar', 'baz')

  return { bar: 'baz' }
}

exports.effect = bar
