'use strict'

const { Connector, exceptions: { NotImplementedException } } = require('@toa.io/core')
const { console } = require('@toa.io/libraries/console')

const translate = require('./translate')

/**
 * @implements {toa.extensions.exposition.Remote}
 */
class Remote extends Connector {
  /** @type {toa.core.Runtime} */
  #remote

  /** @type {toa.extensions.exposition.Tree} */
  #tree

  /**
   * @param {toa.extensions.exposition.Server} server
   * @param {toa.core.Runtime} remote
   * @param {toa.extensions.exposition.Tree} tree
   */
  constructor (server, remote, tree) {
    super()

    const { namespace, name } = remote.locator
    const route = '/' + (namespace === name ? namespace : namespace + '/' + name) + '*'

    server.route(route, (req, res) => this.#reply(req, res))

    this.#remote = remote
    this.#tree = tree

    this.depends(server)
    this.depends(remote)
  }

  update (declaration) {
    console.info(`Updating tree '${this.#remote.locator.id}'`)

    this.#tree.update(declaration)
  }

  /**
   * @hot
   * @param {toa.extensions.exposition.http.Request} req
   * @param {toa.extensions.exposition.http.Response} res
   * @return {Promise<void>}
   */
  async #reply (req, res) {
    const match = this.#tree.match(req.params[0])

    if (match !== undefined) {
      try {
        const reply = await this.#call(req, match)

        translate.response.ok(reply, res, req)
      } catch (e) {
        translate.response.exception(e, res)
      }
    } else {
      translate.response.missed(res)
    }

    res.end()
  }

  /**
   * @param {toa.extensions.exposition.http.Request} req
   * @param {toa.extensions.exposition.tree.Match} match
   * @return {Promise<toa.core.Reply>}
   */
  async #call (req, match) {
    const method = req.method === 'HEAD' ? 'GET' : req.method
    const operation = match.node.operations[method]

    if (operation === undefined) throw new NotImplementedException()

    const request = translate.request(req, match.params)
    const query = match.node.query.parse(request.query, operation)

    if (query !== undefined) request.query = query

    return this.#remote.invoke(operation.operation, request)
  }
}

exports.Remote = Remote
