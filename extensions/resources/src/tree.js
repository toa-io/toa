'use strict'

const path = require('path')
const { match } = require('path-to-regexp')

class Tree {
  #nodes = []

  constructor (tree) {
    this.#traverse(tree)
  }

  match (path) {
    let match

    const node = this.#nodes.find((node) => (match = node.match(path)))

    return node === undefined ? undefined : { node, params: match.params }
  }

  update (tree) {
    // TODO: add test
    this.#nodes = []
    this.#traverse(tree)
  }

  #traverse (node, route = '/') {
    const current = {}

    route = trail(route)
    current.match = match(route)

    if (node.operations) {
      current.operations = {}

      for (const operation of node.operations) {
        current.operations[method(operation)] = operation.operation
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (key.substr(0, 1) === '/') this.#traverse(value, path.posix.resolve(route, '.' + key))
    }

    this.#nodes.push(current)
  }
}

const trail = (path) => path[path.length - 1] === '/' ? path : path + '/'

const method = (operation) => {
  if (operation.type === 'observation') return 'GET'

  if (operation.query === false) return 'POST'
  else return 'PUT'
}

exports.Tree = Tree
