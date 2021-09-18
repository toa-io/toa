'use strict'

const { console } = require('@kookaburra/gears')
const { id } = require('./id')

class Connector {
  #connectors = []
  #connecting
  #disconnecting

  id

  constructor () {
    this.id = this.constructor.name + '#' + id().substring(0, 8)
  }

  depends (connector) {
    let next

    if (connector instanceof Array) {
      next = new Connector()

      for (const item of connector) {
        this.#connectors.push(item)
        item.depends(next)
      }

      console.debug(`${this.id} depends on ` +
        `[${connector.map((connector) => connector.id).join(', ')}]`)
    } else {
      next = connector

      console.debug(`${this.id} depends on ${next.id}`)
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

    console.debug(`Connector '${this.id}' connected`)
  }

  async disconnect (interrupt) {
    if (!interrupt) await this.#connecting

    if (this.#disconnecting) return this.#disconnecting

    this.#connecting = undefined

    this.#disconnecting = (async () => {
      if (!interrupt) await this.disconnection()

      await Promise.all(this.#connectors.map(connector => connector.disconnect()))
      this.disconnected()
    })()

    await this.#disconnecting

    console.debug(`Connector '${this.id}' disconnected`)
  }

  async connection () {}
  async disconnection () {}

  disconnected () {}
}

exports.Connector = Connector
