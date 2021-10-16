'use strict'

const { Connector } = require('@toa.io/core')
const { empty } = require('@toa.io/gears')

class Remote extends Connector {
  #remote
  #tree

  constructor (server, remote, tree) {
    super()

    this.#remote = remote
    this.#tree = tree

    const route = `/${this.#remote.locator.domain}/${this.#remote.locator.name}*`
    server.route(route, (req, res) => this.#reply(req, res))

    this.depends(server)
    this.depends(remote)
  }

  async #reply (req, res) {
    const path = req.params[0]
    const node = this.#tree.node(path)
    const match = node.match(path)
    const operation = node.operations[req.method]

    const request = {}

    if (!empty(req.body)) request.input = req.body
    if (!empty(req.query)) request.query = req.query

    if (match.params) {
      if (request.query === undefined) request.query = {}

      for (const [key, value] of Object.entries(match.params)) {
        if (key === 'id') request.query.id = value
      }
    }

    const reply = await this.#remote.invoke(operation, request)

    res.status(200)
    res.send(reply)
    res.end()
  }
}

exports.Remote = Remote
