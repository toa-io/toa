'use strict'

const { Client } = require('./client')
const { Consumer } = require('./consumer')
const { Producer } = require('./producer')
const { Server } = require('./server')

class Factory {
  #server
  #clients

  constructor () {
    this.#server = new Server()
  }

  producer (runtime) {
    return new Producer(this.#server, runtime)
  }

  consumer (locator) {
    const name = locator.fqn

    if (!this.#clients[name]) this.#clients[name] = new Client(locator)

    return new Consumer(this.#clients[name])
  }
}

exports.Factory = Factory
