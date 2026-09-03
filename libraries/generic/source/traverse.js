import { plain } from './plain.js'

/**
 * @param {object} object
 * @param {(node: object) => object} visit
 * @returns {object}
 */
export const traverse = (object, visit) => {
  if (!plain(object)) return object

  let visited = visit(object)

  if (visited === undefined) visited = object
  if (!plain(visited)) return visited

  for (const [key, value] of Object.entries(visited)) visited[key] = traverse(value, visit)

  return visited
}
