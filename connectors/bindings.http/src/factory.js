'use strict'

const Agent = require('agentkeepalive')

const { Consumer } = require('./consumer')
const { Producer } = require('./producer')
const { Server } = require('./server')

class Factory {
  #server
  #agents = {}

  constructor () {
    this.#server = new Server()
  }

  producer (runtime, endpoints) {
    return new Producer(this.#server, runtime, endpoints)
  }

  consumer (locator) {
    const name = locator.fqn

    if (!this.#agents[name]) this.#agents[name] = new Agent(AGENT_OPTIONS)

    return new Consumer(this.#agents[name], locator)
  }
}

const AGENT_OPTIONS = { keepAlive: process.env.KOO_ENV !== 'dev' && process.env.KOO_ENV !== 'test' }

exports.Factory = Factory
