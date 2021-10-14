'use strict'

const normalize = (node, manifest) => {
  if (node.operations !== undefined) {
    node.operations = node.operations.map((operation) => {
      if (typeof operation === 'object') operation = operation.operation

      if (manifest.operations[operation] === undefined) {
        throw new Error(`Resource references undefined operation '${operation}'`)
      }

      const { type, query } = manifest.operations[operation]
      const normal = { operation, type }

      if (query !== undefined) normal.query = query

      return normal
    })
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.substr(0, 1) === '/') normalize(value, manifest)
  }

  return node
}

exports.normalize = normalize
