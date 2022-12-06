'use strict'

const find = require('../util/find')

async function replay (argv) {
  // prevent loading userland which is intended for local use only
  const { component } = require('@toa.io/userland/samples')

  const path = find.component(argv.path)
  const ok = await component(path)
  const label = ok ? GREEN + 'PASSED' : RED + 'FAILED'
  const message = label + RESET

  process.on('beforeExit', () => console.log(message))
}

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

exports.replay = replay
