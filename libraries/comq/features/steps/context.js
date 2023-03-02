'use strict'

const { World } = require('@cucumber/cucumber')
const { connect } = require('@toa.io/libraries/comq')

/**
 * @implements {comq.features.Context}
 */
class Context extends World {
  /** @type {comq.IO} */
  static io
  static url

  io
  reply
  consumed
  published
  events = {}
  exception
  expected

  async connect (user, password) {
    const url = locator(user, password)

    if (url !== Context.url) await this.#connect(url)

    this.io = Context.io
  }

  async #connect (url) {
    if (Context.url !== undefined) await Context.disconnect()

    Context.url = url
    Context.io = await connect(url)

    for (const event of EVENTS) {
      Context.io.diagnose(event, () => (this.events[event] = true))
    }
  }

  static async disconnect () {
    await Context.io?.close()

    Context.io = undefined
  }
}

const locator = (user, password) => {
  if (user === undefined) {
    user = USER
    password = PASSWORD
  }

  return PROTOCOL + user + ':' + password + '@' + HOST
}

const PROTOCOL = 'amqp://'
const HOST = 'localhost:5673'
const USER = 'developer'
const PASSWORD = 'secret'

/** @type {comq.diagnostics.event[]} */
const EVENTS = ['open', 'close', 'flow']

exports.Context = Context
