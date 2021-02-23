'use strict'

const path = require('path')
const glob = require('glob-promise')

const { manifest } = require('./manifest')
const { algorithms } = require('./algorithms')

async function load (dir, options) {
  const opts = { ...DEFAULTS, ...options }

  const manifestPath = path.resolve(dir, opts.manifestFile)
  const algorithmsGlob = path.resolve(dir, opts.operationsPath, '*')
  const algorithmFiles = await glob(algorithmsGlob)

  return {
    manifest: await manifest(manifestPath),
    algorithms: algorithms(algorithmFiles)
  }
}

const DEFAULTS = {
  manifestFile: 'kookaburra.yaml',
  operationsPath: './operations'
}

exports.load = load
