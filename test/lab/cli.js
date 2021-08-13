'use strict'

const path = require('path')

const execa = require('execa')

const cli = async (...args) => {
  args.push('--debug')

  return execa.node(BIN, args)
}

const BIN = path.join(path.dirname(require.resolve('@kookaburra/cli')), './bin/kookaburra')

exports.cli = cli
