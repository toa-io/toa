'use strict'

const normalize = (node, manifest) => {
  if (node.operations !== undefined) {
    node.operations = node.operations.map((operation) => {
      if (typeof operation === 'object') operation = operation.operation

      if (manifest.operations[operation] === undefined) {
        throw new Error(`Resource references undefined operation '${operation}'`)
      }

      const { type, subject, query } = manifest.operations[operation]
      const normal = { operation, type, subject }

      if (query !== undefined) normal.query = query

      return normal
    })
  }

  if (node.query !== undefined) {
    if (node.query.omit !== undefined && typeof node.query.omit !== 'object') {
      node.query.omit = { value: node.query.omit }
    }

    if (node.query.limit !== undefined && typeof node.query.limit !== 'object') {
      node.query.limit = { value: node.query.limit }
    }
  }

  for (const [key, value] of Object.entries(node)) {
    if (key.substr(0, 1) === '/') normalize(value, manifest)
  }

  return node
}

exports.normalize = normalize
