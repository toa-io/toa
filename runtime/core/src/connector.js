'use strict'

const { console } = require('@toa.io/gears')
const { newid } = require('@toa.io/gears')

class Connector {
  #connectors = []
  #connecting
  #disconnecting

  id

  constructor () {
    this.id = this.constructor.name + '#' + newid().substring(0, 8)
  }

  depends (connector) {
    let next

    if (connector instanceof Array) {
      connector = connector.filter((item) => item instanceof Connector)

      if (connector.length > 0) {
        next = new Connector()

        for (const item of connector) {
          this.#connectors.push(item)
          item.depends(next)
        }

        console.debug(`${this.id} depends on ` +
          `[${connector.map((connector) => connector.id).join(', ')}]`)
      }
    } else {
      if (connector instanceof Connector) {
        next = connector

        console.debug(`${this.id} depends on ${next.id || next.constructor.name}`)
      }
    }

    if (next !== undefined) this.#connectors.push(next)
    else return this

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

  debug (node = {}) {
    if (this.#connectors.length === 0) {
      node[this.id] = null
    } else {
      node[this.id] = { connected: this.#connecting !== undefined }

      for (const connector of this.#connectors) connector.debug?.(node[this.id])
    }

    return node
  }

  async connection () {}

  async disconnection () {}

  disconnected () {}
}

exports.Connector = Connector
