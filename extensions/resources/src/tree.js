'use strict'

const path = require('path')
const { match } = require('path-to-regexp')

class Tree {
  #nodes
  #query

  constructor (tree, query) {
    this.#query = query

    this.update(tree)
  }

  /** @hot */
  match (path) {
    // region dev only check
    if (process.env.TOA_ENV === 'dev') {
      const nodes = this.#nodes.filter((node) => node.match(path) !== false)

      if (nodes.length > 1) {
        const routes = nodes.map((node) => node.route)

        throw new Error('Ambiguous routes ' + routes.join(', '))
      }
    }
    // endregion

    let match

    const node = this.#nodes.find((node) => (match = node.match(path)) !== false)

    return node === undefined ? undefined : { node, params: match.params }
  }

  update (tree) {
    this.#nodes = []
    this.#traverse(tree)
  }

  #traverse (node, route, parent) {
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

    for (const [key, value] of Object.entries(node)) {
      if (key.substr(0, 1) === '/') this.#traverse(value, path.posix.resolve(route, '.' + key), node)
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
