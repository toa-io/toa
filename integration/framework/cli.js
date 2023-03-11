'use strict'

const { resolve, join, dirname } = require('node:path')
const execa = require('execa')
const { split } = require('@toa.io/generic')

const cli = (path) => {
  const cwd = resolve(__dirname, '..', path)

  return async (args, options = undefined) => execa.node(BIN, split(args), { cwd, ...options })
}

const BIN = join(dirname(require.resolve('@toa.io/runtime')), 'bin/toa')

exports.cli = cli
