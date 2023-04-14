'use strict'

/**
 * @param {object} object
 * @param {(node: object) => object} visit
 * @returns {object}
 */
const traverse = (object, visit) => {
  if (typeof object !== 'object' || object === null || Array.isArray(object)) return object

  let visited = visit(object)

  if (visited === undefined) visited = object
  if (typeof visited !== 'object' || visited === null) return visited

  for (const [key, value] of Object.entries(visited)) visited[key] = traverse(value, visit)

  return visited
}

exports.traverse = traverse
