'use strict'

const { console } = require('@kookaburra/gears')

class Connector {
  #connectors = []
  #connecting
  #disconnecting

  depends (connector) {
    let next

    if (connector instanceof Array) {
      next = new Connector()

      for (const item of connector) {
        this.#connectors.push(item)
        item.depends(next)
      }
    } else {
      next = connector
    }

    this.#connectors.push(next)

    return next
  }

  async connect () {
    if (this.#connecting) return this.#connecting

    this.#disconnecting = undefined

    this.#connecting = (async () => {
      await Promise.all(this.#connectors.map(connector => connector.connect()))
      await this.connection()
    })()

    try {
      await this.#connecting
    } catch (e) {
      await this.disconnect(true)
      throw e
    }

    console.debug(`Connector '${this.constructor.name}' connected`)
  }

  async disconnect (interrupt) {
    if (!interrupt) await this.#connecting

    if (this.#disconnecting) return this.#disconnecting

    this.#connecting = undefined

    this.#disconnecting = (async () => {
      if (!interrupt) await this.disconnection()

      await Promise.all(this.#connectors.map(connector => connector.disconnect()))
    })()

    await this.#disconnecting

    console.debug(`Connector '${this.constructor.name}' disconnected`)
  }

  async connection () {}
  async disconnection () {}
}

exports.Connector = Connector
