'use strict'

const { Connector, exceptions: { NotImplementedException } } = require('@toa.io/core')
const { empty } = require('@toa.io/gears')

const translate = require('./translate')

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

  update (definition) {
    this.#tree.update(definition)
  }

  async #reply (req, res) {
    const match = this.#tree.match(req.params[0])

    if (match !== undefined) {
      try {
        const reply = await this.#call(match, req)
        translate.ok(reply, res, req)
      } catch (e) {
        translate.exception(e, res)
      }
    } else {
      translate.missed(res)
    }

    res.end()
  }

  #call (match, req) {
    const operation = match.node.operations[req.method]

    if (operation === undefined) throw new NotImplementedException()

    const request = {}

    if (!empty(req.body)) request.input = req.body
    if (!empty(req.query)) request.query = req.query

    if (!empty(match.params)) {
      if (request.query === undefined) request.query = {}

      for (const [key, value] of Object.entries(match.params)) {
        if (key === 'id') request.query.id = value
      }
    }

    return this.#remote.invoke(operation, request)
  }
}

exports.Remote = Remote
