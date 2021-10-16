'use strict'

const path = require('path')
const execa = require('execa')

const { locate } = require('./dummies')

const cli = (dummy) => {
  const cwd = locate(dummy)

  return async (...args) => execa.node(BIN, args.map(stringify), { cwd })
}

const stringify = (value) => {
  if (typeof value === 'object') return `"${JSON.stringify(value)}"`
  else return value.toString()
}

const BIN = path.join(path.dirname(require.resolve('@toa.io/cli')), './bin/toa')

exports.cli = cli
