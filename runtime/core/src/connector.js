'use strict'

const { console } = require('openspan')
const { newid } = require('@toa.io/generic')

/**
 * Abstract connections hierarchy
 * @implements {toa.core.Connector}
 */
class Connector {
  /** @type {Array<Connector>} */
  #dependencies = []

  /** @type {Array<Connector>} */
  #links = []

  /** @type {Promise} */
  #connecting

  /** @type {Promise} */
  #disconnecting

  /** @type {string} */
  id
  /** @type {boolean} */
  connected = false

  constructor () {
    this.id = this.constructor.name + '#' + newid().substring(0, 8)
  }

  /**
   * Creates a dependency and backlink with another Connector or a set of Connectors
   *
   * See .connect() and .disconnect()
   *
   * @param connector {Connector | any | Array<Connector | any>}
   * @returns {Connector}
   */
  depends (connector) {
    /** @type {Connector} */
    let next

    if (connector instanceof Array) {
      if (connector.length === 0) throw new Error('Connectors array must not be empty')

      if (connector.length > 1) {
        next = new Connector()

        for (const item of connector) {
          this.#dependencies.push(item)
          item.depends(next)
        }
      } else next = connector[0]
    } else next = connector

    this.#dependencies.push(next)
    next.link(this)

    return next
  }

  /**
   * Creates a backlink to another Connector
   *
   * See .connect() and .disconnect()
   *
   * @param connector {Connector}
   * @returns {void}
   */
  link (connector) {
    this.#links.push(connector)
  }

  /**
   * Connects dependants then self
   *
   * In case of exception disconnects with current connection interruption
   *
   * Method is idempotent
   *
   * @returns {Promise<void>}
   */
  async connect () {
    if (this.#connecting) return this.#connecting

    this.#disconnecting = undefined

    this.#connecting = (async () => {
      await Promise.all(this.#dependencies.map((connector) => connector.connect()))
      await this.open()
    })()

    try {
      await this.#connecting
      this.connected = true
    } catch (e) {
      await this.disconnect(true)
      throw e
    }
  }

  /**
   * Disconnects self then dependants
   *
   * Does nothing if there are connected linked Connectors
   *
   * Method is idempotent
   *
   * @param [interrupt] {boolean}
   * @returns {Promise<void>}
   */
  async disconnect (interrupt) {
    if (interrupt !== true) await this.#connecting

    if (this.#disconnecting) return this.#disconnecting

    const linked = this.#links.reduce((acc, parent) => acc || parent.connected, false)

    if (linked && interrupt !== true) return

    this.connected = false
    this.#connecting = undefined

    this.#disconnecting = (async () => {
      const start = +new Date()

      const interval = setInterval(() => {
        const delay = +new Date() - start

        if (delay > DELAY)
          console.warn(`Connector ${this.id} still disconnecting (${delay})`)
      }, DELAY)

      if (interrupt !== true) await this.close()

      clearInterval(interval)

      await Promise.all(this.#dependencies.map(connector => connector.disconnect()))

      await this.dispose()
    })()

    await this.#disconnecting
  }

  async reconnect () {
    await this.disconnect()
    await this.connect()
  }

  debug (node = {}) {
    node[this.id] = { connected: this.connected }

    if (this.#dependencies.length > 0) for (const connector of this.#dependencies) connector.debug?.(node[this.id])

    return node
  }

  /**
   * Called on connection
   */
  async open () {}

  /**
   * Called on disconnection
   */
  async close () {}

  /**
   * Called after self and dependants disconnection is complete
   */
  async dispose () {}
}

const DELAY = 5000

exports.Connector = Connector
