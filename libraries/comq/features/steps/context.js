'use strict'

const { World } = require('@cucumber/cucumber')
const { connect } = require('@toa.io/libraries/comq')

class Context extends World {
  /** @type {comq.IO} */
  static io

  /** @type {comq.IO} */
  io

  async connect (url) {
    if (url !== this.url) {
      if (this.url !== undefined) await Context.io.close()

      this.url = url

      Context.io = await connect(url)
    }

    this.io = Context.io
  }

  static async disconnect () {
    await Context.io?.close()
  }
}

exports.Context = Context
