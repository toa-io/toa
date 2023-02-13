'use strict'

const { World, setWorldConstructor } = require('@cucumber/cucumber')
const { connect } = require('@toa.io/libraries/comq')

class ConnectedWorld extends World {
  /** @type {comq.IO} */
  static io

  async connect (url) {
    ConnectedWorld.io ??= await connect(url)

    this.io = ConnectedWorld.io
  }

  static async disconnect () {
    await ConnectedWorld.io?.close()
  }
}

setWorldConstructor(ConnectedWorld)

exports.ConnectedWorld = ConnectedWorld
