'use strict'

const path = require('path')

const { yaml } = require('@kookaburra/gears')
const { parse } = require('./operations')
const validate = require('./validation')

async function traverse (dir, options) {
  const opts = { ...DEFAULTS, ...options }

  const manifest = await yaml(path.resolve(dir, opts.manifestPath))
  const operations = await parse(path.resolve(dir, opts.operationsPath))

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

exports.traverse = traverse
