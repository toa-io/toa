'use strict'

const path = require('path')
const { match } = require('path-to-regexp')

const { console } = require('@toa.io/gears')

class Tree {
  #nodes
  #query

  constructor (tree, query) {
    this.#query = query

    this.update(tree)
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

    let paths = 0

    for (const [key, value] of Object.entries(node)) {
      if (key.substring(0, 1) === '/') {
        paths++
        this.#traverse(value, path.posix.resolve(route, '.' + key), node)
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
