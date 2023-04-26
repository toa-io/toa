'use strict'

const path = require('path')
const { match } = require('path-to-regexp')

const { console } = require('@toa.io/console')

/**
 * @implements {toa.extensions.exposition.Tree}
 */
class Tree {
  /** @type {toa.extensions.exposition.tree.Node[]} */
  #nodes

  /** @type {toa.extensions.exposition.query.Factory} */
  #query

  /**
   * @param {toa.extensions.exposition.query.Factory} query
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
   * @param {toa.extensions.exposition.declarations.Node | any} node
   * @param {string} route
   * @param {toa.extensions.exposition.declarations.Node} parent
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

    let branches = 0

    for (const [key, value] of Object.entries(node)) {
      if (key[0] === '/') {
        branches++

        const branch = path.posix.resolve(route, '.' + key)

        this.#traverse(value, branch, node)
      }
    }

    if (branches === 0 && node.operations === undefined) {
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
  if (operation.type === 'computation') return 'GET'
  if (operation.type === 'effect') return 'POST'
}

exports.Tree = Tree
