'use strict'

const { console } = require('@toa.io/gears')
const { newid } = require('@toa.io/gears')

class Connector {
  #connectors = []
  #linked = []
  #connecting
  #disconnecting

  id
  connected = false

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
      }
    } else {
      if (connector instanceof Connector) {
        next = connector
      }
    }

    if (next !== undefined) {
      this.#connectors.push(next)
      next.link(this)

      return next
    } else return this
  }

  link (connector) {
    this.#linked.push(connector)
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
      this.connected = true
    } catch (e) {
      await this.disconnect(true)
      throw e
    }

    console.debug(`Connector '${this.id}' connected`)
  }

  async disconnect (interrupt) {
    if (interrupt !== true) await this.#connecting

    if (this.#disconnecting) return this.#disconnecting

    const linked = this.#linked.reduce((acc, parent) => acc || parent.connected, false)

    if (linked && interrupt !== true) return

    this.connected = false
    this.#connecting = undefined

    this.#disconnecting = (async () => {
      const start = +new Date()
      const interval = setInterval(() => {
        const delay = +new Date() - start

        if (delay > DELAY) console.warn(`Connector ${this.id} still disconnecting (${delay})`)
      }, DELAY)

      if (interrupt !== true) await this.disconnection()

      clearInterval(interval)

      await Promise.all(this.#connectors.map(connector => connector.disconnect()))
      this.disconnected()
    })()

    await this.#disconnecting

    console.debug(`Connector '${this.id}' disconnected`)
  }

  debug (node = {}) {
    node[this.id] = { connected: this.connected }

    if (this.#connectors.length > 0) for (const connector of this.#connectors) connector.debug?.(node[this.id])

    return node
  }

  async connection () {}

  async disconnection () {}

  disconnected () {}
}

const DELAY = 5000

exports.Connector = Connector
