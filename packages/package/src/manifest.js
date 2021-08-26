'use strict'

const path = require('path')

const { yaml } = require('@kookaburra/gears')
const { validate } = require('./validate')

const manifest = async (root, options) => {
  const opts = { ...DEFAULTS, ...options }

  const manifest = await yaml(path.resolve(root, opts.manifestPath))

  validate(manifest)

  manifest.operations = await Promise.all(manifest.operations.map(async (operation) => {
    const { Bridge } = require(operation.bridge)
    const manifest = await Bridge.manifest(root, operation.name)

    return merge(operation, manifest)
  }))

  return manifest
}

const merge = (target, source) => {
  if (!source) { return target }

  Object.keys(source).forEach((key) => {
    if (typeof source[key] === 'object') {
      if (target[key] === undefined) { target[key] = {} }

      if (typeof target[key] !== 'object') {
        throw new Error(`Manifest conflict on key '${key}' ` +
          `(${typeof target[key]}, ${typeof source[key]})`)
      }

      target[key] = merge(target[key], source[key])
    } else {
      if (target[key] !== undefined && target[key] !== source[key]) {
        throw new Error(`Manifest conflict on key '${key}' ` +
          `(${target[key]}, ${source[key]})`)
      }

      target[key] = source[key]
    }
  })

  return target
}

const DEFAULTS = {
  manifestPath: 'manifest.yaml'
}

exports.manifest = manifest
