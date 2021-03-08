'use strict'

class Connector {
  #connectors = []
  #connecting
  #disconnecting

  depends (connector) {
    let next

    if (Array.isArray(connector)) {
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
    if (this.#connecting) { return this.#connecting }

    this.#connecting = (async () => {
      await Promise.all(this.#connectors.map(async connector => await connector.connect()))
      await this.connection()
    })()

    try {
      await this.#connecting
    } catch (e) {
      await this.disconnect(true)
      throw e
    }
  }

  async disconnect (interrupt) {
    if (!interrupt) { await this.#connecting }

    if (this.#disconnecting) { return this.#disconnecting }

    this.#disconnecting = (async () => {
      if (!interrupt) { await this.disconnection() }
      await Promise.all(this.#connectors.map(async connector => await connector.disconnect()))
    })()

    await this.#disconnecting
  }

  async connection () {}
  async disconnection () {}
}

exports.Connector = Connector
