'use strict'

const path = require('path')
const glob = require('glob-promise')

const { manifest } = require('./manifest')
const { operations } = require('./operations')

async function load (dir, options) {
  const opts = { ...DEFAULTS, ...options }

  const manifestPath = path.resolve(dir, opts.manifestFile)
  const operationsGlob = path.resolve(dir, opts.operationsPath, '*')

  const operationFiles = await glob(operationsGlob)

  return {
    manifest: await manifest(manifestPath),
    operations: operations(operationFiles)
  }
}

const DEFAULTS = {
  manifestFile: 'kookaburra.yaml',
  operationsPath: './operations'
}

exports.load = load
