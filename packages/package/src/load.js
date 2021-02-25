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

  const component = {}

  component.manifest = await manifest(manifestPath)
  component.algorithms = algorithms(algorithmFiles, component.manifest.operations)

  return component
}

const DEFAULTS = {
  manifestFile: 'kookaburra.yaml',
  operationsPath: './operations'
}

exports.load = load
