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

  producer (locator, endpoints, target) {
    return new Producer(this.#server, locator, endpoints, target)
  }

  consumer (locator, endpoint) {
    const id = locator.id

    if (!this.#agents[id]) this.#agents[id] = new Agent(AGENT_OPTIONS)

    return new Consumer(this.#agents[id], locator, endpoint)
  }
}

const AGENT_OPTIONS = { keepAlive: process.env.TOA_ENV !== 'dev' && process.env.TOA_ENV !== 'test' }

exports.Factory = Factory
