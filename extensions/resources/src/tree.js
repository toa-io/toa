'use strict'

const path = require('path')
const { match } = require('path-to-regexp')

const { console } = require('@toa.io/gears')

/**
 * @implements {toa.extensions.resources.Tree}
 */
class Tree {
  /** @type {toa.extensions.resources.tree.Node[]} */
  #nodes
  #query

  /**
   * @param {Function} query
   */
  constructor (query) {
    this.#query = query
  }

  /** @hot */
  match (path) {
    // dev only check
    if (process.env.TOA_ENV === 'local') {
      const nodes = this.#nodes.filter((node) => node.match(path) !== false)

      if (nodes.length > 1) {
        const routes = nodes.map((node) => node.route)

        throw new Error('Ambiguous routes ' + routes.join(', '))
      }
    }

    let match

    const node = this.#nodes.find((node) => {
      match = node.match(path)
      return match !== false
    })

    return node === undefined ? undefined : { node, params: match.params }
  }

  update (tree) {
    this.#nodes = []
    this.#traverse(tree)
  }

  /**
   * @param {toa.extensions.resources.declarations.Node} node
   * @param {string} route
   * @param {toa.extensions.resources.declarations.Node} parent
   */
  #traverse (node, route = undefined, parent = undefined) {
    const current = {}

    if (route === undefined) route = '/'
    else route = trail(route)

    if (parent !== undefined) node.parent = parent

    if (node.operations) {
      current.route = route
      current.match = match(route)
      current.query = this.#query(node)
      current.operations = {}

      for (const operation of node.operations) current.operations[method(operation)] = operation

      this.#nodes.push(current)
    }

    let paths = 0

    for (const [key, value] of Object.entries(node)) {
      if (key[0] === '/') {
        paths++

        const branch = path.posix.resolve(route, '.' + key)

        this.#traverse(value, branch, node)
      }
    }

    if (paths === 0 && node.operations === undefined) {
      console.warn(`Resource tree leaf '${route}' has no operations`)
    }
  }
}

const trail = (path) => path[path.length - 1] === '/' ? path : path + '/'

const method = (operation) => {
  if (operation.type === 'transition') {
    if (operation.query === false) return 'POST'
    else return 'PUT'
  }

  if (operation.type === 'observation') return 'GET'
  if (operation.type === 'assignment') return 'PATCH'
}

exports.Tree = Tree
