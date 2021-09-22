'use strict'

const { merge } = require('@kookaburra/gears')

const operations = async (root, manifest) => {
  if (!(manifest.operations instanceof Array)) return

  manifest.operations = await Promise.all(manifest.operations.map(async (operation) => {
    if (!operation.name) throw new Error('Operation must have a name')
    if (!operation.bridge) operation.bridge = manifest.bridge

    const bridge = require(operation.bridge)
    const declaration = await bridge.declare.operation(root, operation.name)

    return merge(operation, declaration)
  }))
}

// const merge = (target, source) => {
//   if (!source) return target
//
//   Object.keys(source).forEach((key) => {
//     if (typeof source[key] === 'object') {
//       if (target[key] === undefined) { target[key] = {} }
//
//       if (typeof target[key] !== 'object') {
//         throw new Error(`Manifest conflict with Bridge on key '${key}' ` +
//           `(${typeof target[key]}, ${typeof source[key]})`)
//       }
//
//       target[key] = merge(target[key], source[key])
//     } else {
//       if (target[key] !== undefined && target[key] !== source[key]) {
//         throw new Error(`Manifest conflict with Bridge on key '${key}' ` +
//           `(${target[key]}, ${source[key]})`)
//       }
//
//       target[key] = source[key]
//     }
//   })
//
//   return target
// }

exports.operations = operations
