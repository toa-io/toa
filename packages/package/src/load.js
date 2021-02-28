'use strict'

const path = require('path')

const loaders = { ...require('./load/manifest'), ...require('./load/operations') }

async function load (dir, options) {
  const opts = { ...DEFAULTS, ...options }
  const manifest = await loaders.manifest(path.resolve(dir, opts.manifestPath))

  await loaders.operations(path.resolve(dir, opts.operationsPath), manifest.operations)

  return manifest
}

const DEFAULTS = {
  manifestPath: 'kookaburra.yaml',
  operationsPath: './operations'
}

exports.load = load
