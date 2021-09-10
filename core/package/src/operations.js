'use strict'

const operations = async (root, manifest) => {
  if (!(manifest.operations instanceof Array)) return

  manifest.operations = await Promise.all(manifest.operations.map(async (operation) => {
    if (!operation.name) return operation

    const { Bridge } = require(operation.bridge || '@kookaburra/bridges.javascript.native')
    const descriptor = await Bridge.manifest(root, operation.name)

    return merge(operation, descriptor)
  }))
}

const merge = (target, source) => {
  if (!source) return target

  Object.keys(source).forEach((key) => {
    if (typeof source[key] === 'object') {
      if (target[key] === undefined) { target[key] = {} }

      if (typeof target[key] !== 'object') {
        throw new Error(`Manifest conflict with Bridge on key '${key}' ` +
          `(${typeof target[key]}, ${typeof source[key]})`)
      }

      target[key] = merge(target[key], source[key])
    } else {
      if (target[key] !== undefined && target[key] !== source[key]) {
        throw new Error(`Manifest conflict with Bridge on key '${key}' ` +
          `(${target[key]}, ${source[key]})`)
      }

      target[key] = source[key]
    }
  })

  return target
}

exports.operations = operations
