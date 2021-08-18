'use strict'

const path = require('path')

const execa = require('execa')

const cli = async (...args) => {
  args.push('--debug')

  let ok, oh

  try {
    ok = await execa.node(BIN, args)
  } catch (error) {
    oh = error
  }

  return { ok, oh }
}

const BIN = path.join(path.dirname(require.resolve('@kookaburra/cli')), './bin/kookaburra')

exports.cli = cli
