'use strict'

import { setTimeout } from 'node:timers/promises'

async function baz (input, context) {
  await setTimeout(30)
  await context.storages.octets.annotate(input.path, 'baz', 'qux')
}

exports.effect = baz
