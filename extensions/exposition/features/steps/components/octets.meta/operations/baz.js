'use strict'

import { setTimeout } from 'node:timers/promises'

async function baz (input, context) {
  return context.storages.octets.annotate(input.path, 'baz', 'qux')
}

exports.effect = baz
