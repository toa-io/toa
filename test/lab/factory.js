'use strict'

const path = require('path')

const { Runtime } = require('./runtime')

const runtime = (dummy) => {
  const dir = path.join(DUMMIES, dummy)

  return new Runtime(dir)
}

const DUMMIES = path.dirname(require.resolve('@kookaburra/dummies'))

exports.runtime = runtime
