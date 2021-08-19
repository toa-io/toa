'use strict'

const path = require('path')
const execa = require('execa')

const cli = async (...args) => {
  args.push('--ugly')
  args.push('--debug')

  let ok, oh

  try {
    ok = await execa.node(BIN, args)

    if (ok.stdout) ok.output = JSON.parse(ok.stdout.split('\n').pop())
  } catch (error) {
    oh = error

    if (!cli.silent) console.error(error)
    else cli.silent = false
  }

  return { ok, oh }
}

const BIN = path.join(path.dirname(require.resolve('@kookaburra/cli')), './bin/kookaburra')

exports.cli = cli
