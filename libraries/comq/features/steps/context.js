'use strict'

const { World } = require('@cucumber/cucumber')
const { connect } = require('@toa.io/libraries/comq')

/**
 * @implements {comq.features.Context}
 */
class Context extends World {
  /** @type {comq.IO} */
  static io

  url
  io
  reply
  consumed
  published
  events = {}
  exception

  async connect (user, password) {
    const url = locator(user, password)

    if (url !== this.url) {
      if (this.url !== undefined) await Context.io.close()

      this.url = url

      Context.io = await connect(url)
      Context.io.diagnose('flow', () => (this.events.flow = true))
    }

    this.io = Context.io
  }

  static async disconnect () {
    await Context.io?.close()
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

exports.Context = Context
