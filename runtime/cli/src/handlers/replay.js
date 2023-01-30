'use strict'

const find = require('../util/find')

async function replay (argv) {
  // prevent loading userland which is intended for local use only
  const { context, components } = require('@toa.io/userland/samples')

  /** @type {boolean} */
  let ok

  const paths = find.components(argv.paths, true)

  if (paths !== null) {
    ok = await components(paths)
  } else {
    // no components found, checking context
    const path = find.context(argv.paths[0], true)

    if (path === null) throw new Error('Neither components nor context found in ' + argv.paths.join(','))

    ok = await context(path)
  }

  const message = (ok ? GREEN + 'PASSED' : RED + 'FAILED') + RESET

  // print after tap's output
  process.on('beforeExit', () => console.log(message))
}

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

exports.replay = replay
