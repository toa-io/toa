'use strict'

/**
 * @param {Object} object
 * @param {(node: Object) => Object} visit
 * @returns {Object}
 */
const traverse = (object, visit) => {
  if (typeof object !== 'object' || object === null) return object

  const visited = visit(object)

  if (typeof visited !== 'object' || visited === null) return visited

  for (const [key, value] of Object.entries(visited)) visited[key] = traverse(value, visit)

  return visited
}

exports.traverse = traverse
