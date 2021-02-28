'use strict'

const path = require('path')

const { yaml } = require('@kookaburra/gears')
const { operations: traverse } = require('./load/operations')
const validate = require('./load/validation')

async function load (dir, options) {
  const opts = { ...DEFAULTS, ...options }

  const manifest = await yaml(path.resolve(dir, opts.manifestPath))
  const operations = await traverse(path.resolve(dir, opts.operationsPath))

  validate.manifest(manifest)
  manifest.operations = merge(operations, manifest.operations)
  manifest.operations.forEach(validate.operation)

  return manifest
}

function merge (source, target) {
  if (!target) return source
  if (!source) return target

  source.forEach(operation => {
    const existent = target.find(o => o.name === operation.name)

    if (existent) {
      validate.dupes(operation, existent, 'Operation manifest and component manifest')
      Object.assign(existent, operation)
    } else {
      target.push(operation)
    }
  })

  return target
}

const DEFAULTS = {
  manifestPath: 'kookaburra.yaml',
  operationsPath: './operations'
}

exports.load = load
