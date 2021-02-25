'use strict'

const path = require('path')

const { manifest } = require('./load/manifest')
const { algorithms } = require('./load/algorithms')

async function load (dir, options) {
  const opts = { ...DEFAULTS, ...options }

  return {
    manifest: await manifest(path.resolve(dir, opts.manifestPath)),
    algorithms: await algorithms(path.resolve(dir, opts.operationsPath))
  }
}

const DEFAULTS = {
  manifestPath: 'kookaburra.yaml',
  operationsPath: './operations'
}

exports.load = load
