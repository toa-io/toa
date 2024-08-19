'use strict'

import { setTimeout } from 'node:timers/promises'

async function baz (input, context) {
  await setTimeout(30)
}

exports.effect = baz
