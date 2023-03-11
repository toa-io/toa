'use strict'

/**
 * @returns {toa.extensions.exposition.declarations.Node}
 */
const normalize = (node, manifest) => {
  if (node instanceof Array) node = { operations: node }

  node.operations = operations(node.operations, manifest)
  node.query = query(node.query)

  for (const [key, value] of Object.entries(node)) {
    if (key.substring(0, 1) === '/') node[key] = normalize(value, manifest)
  }

  return node
}

/**
 * @returns {toa.extensions.exposition.declarations.Operation[] | undefined}
 */
const operations = (operations, manifest) => {
  if (operations === undefined) return

  return operations.map((operation) => {
    if (typeof operation === 'object') operation = operation.operation

    if (manifest.operations[operation] === undefined) {
      throw new Error(`Resource references undefined operation '${operation}'`)
    }

    const { type, scope, query } = manifest.operations[operation]
    const normal = { operation, type, scope }

    if (query !== undefined) normal.query = query

    return normal
  })
}

/**
 * @returns {toa.extensions.exposition.declarations.Query | undefined}
 */
const query = (query) => {
  if (query === undefined) return

  if (query.omit !== undefined && typeof query.omit !== 'object') {
    query.omit = { value: query.omit, range: [] }
  }

  if (query.limit !== undefined && typeof query.limit !== 'object') {
    query.limit = { value: query.limit, range: [] }
  }

  return query
}

exports.normalize = normalize
