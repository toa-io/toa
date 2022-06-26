'use strict'

const { resolve, join, dirname } = require('node:path')
const execa = require('execa')
const { split } = require('@toa.io/libraries/generic')

const cli = (path) => {
  const cwd = resolve(__dirname, '..', path)

  return async (args) => execa.node(BIN, split(args), { cwd })
}

const BIN = join(dirname(require.resolve('@toa.io/runtime')), 'bin/toa')

exports.cli = cli
