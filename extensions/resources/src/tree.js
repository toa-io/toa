'use strict'

const path = require('path')
const { pathToRegexp: toRx, match } = require('path-to-regexp')

class Tree {
  #nodes = []

  constructor (tree) {
    this.#traverse(tree)
  }

  node (path) {
    return this.#nodes.find((node) => node.rx.test(path))
  }

  #traverse (node, route = '/') {
    const current = {}

    route = trail(route)
    current.rx = toRx(route, [], toRx.options)
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

toRx.options = {
  sensitive: true,
  strict: true
}

const trail = (path) => path[path.length - 1] === '/' ? path : path + '/'

const method = (operation) => {
  if (operation.type === 'observation') return 'GET'

  if (operation.query === false) return 'POST'
  else return 'PUT'
}

exports.Tree = Tree
