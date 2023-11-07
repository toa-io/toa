'use strict'

import { setTimeout } from 'node:timers/promises'

async function err (_) {
  await setTimeout(20)

  const err = Object.create(Error.prototype)

  err.code = 'ERROR'
  err.message = 'Something went wrong'

  return err
}

exports.effect = err
