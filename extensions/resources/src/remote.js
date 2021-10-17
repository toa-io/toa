'use strict'

const { Connector } = require('@toa.io/core')
const { empty } = require('@toa.io/gears')

const { translate } = require('./translate')

class Remote extends Connector {
  #remote
  #tree

  constructor (server, remote, tree) {
    super()

    server.route(`/${remote.locator.domain}/${remote.locator.name}*`,
      (req, res) => this.#reply(req, res))

    this.#remote = remote
    this.#tree = tree

    this.depends(server)
    this.depends(remote)
  }

  async #reply (req, res) {
    const match = this.#tree.match(req.params[0])

    if (match !== undefined) {
      const reply = await this.#call(match, req)
      translate(reply, res)
    } else {
      translate.mismatch(res)
    }

    res.end()
  }

  #call (match, req) {
    const operation = match.node.operations[req.method]

    const request = {}

    if (!empty(req.body)) request.input = req.body
    if (!empty(req.query)) request.query = req.query

    if (match.params) {
      if (request.query === undefined) request.query = {}

      for (const [key, value] of Object.entries(match.params)) {
        if (key === 'id') request.query.id = value
      }
    }

    return this.#remote.invoke(operation, request)
  }
}

exports.Remote = Remote
