'use strict'

const { resolve, join, dirname } = require('node:path')
const execa = require('execa')

const cli = (path) => {
  const cwd = resolve(__dirname, '..', path)

  return async (...args) => execa.node(BIN, args.map(stringify), { cwd })
}

const stringify = (value) => {
  if (typeof value === 'object') return `"${JSON.stringify(value)}"`
  else return value.toString()
}

const BIN = join(dirname(require.resolve('@toa.io/runtime')), 'bin/toa')

exports.cli = cli
